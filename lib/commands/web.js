import _ from 'lodash';
import B from 'bluebird';
import { errors } from 'appium-base-driver';
import cookieUtils from '../cookies';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

const ELEMENT_OFFSET = 5000;

commands.setFrame = async function (frame) {
  if (!this.isWebContext()) {
    frame = frame ? frame : 'target.frontMostApp()';
    let command = `wd_frame = ${frame}`;
    return await this.uiAutoClient.sendCommand(command);
  }

  let atom;
  if (_.isNull(frame)) {
    this.curWebFrames = [];
    logger.debug('Leaving web frame and going back to default content');
    return;
  }
  if (!_.isUndefined(frame.ELEMENT)) {
    let atomsElement = this.useAtomsElement(frame.ELEMENT);
    let value = await this.executeAtom('get_frame_window', [atomsElement]);
    logger.debug(`Entering new web frame: '${value.WINDOW}'`);
    this.curWebFrames.unshift(value.WINDOW);
  } else {
    atom = _.isNumber(frame) ? 'frame_by_index' : 'frame_by_id_or_name';
    let value = await this.executeAtom(atom, [frame]);
    if (_.isNull(value) || _.isUndefined(value.WINDOW)) {
      throw new errors.NoSuchFrameError();
    }
    logger.debug(`Entering new web frame: '${value.WINDOW}'`);
    this.curWebFrames.unshift(value.WINDOW);
  }
};

commands.getCssProperty = async function (propertyName, el) {
  let atomsElement = this.useAtomsElement(el);
  return await this.executeAtom('get_value_of_css_property', [atomsElement, propertyName]);
};

commands.submit = async function (el) {
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    await this.executeAtom('submit', [atomsElement]);
  } else {
    throw new errors.NotImplementedError();
  }
};

commands.refresh = async function () {
  if (this.isWebContext()) {
    await this.executeAtom('refresh', []);
  } else {
    throw new errors.NotImplementedError();
  }
};

commands.getUrl = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }
  let url = await this.remote.execute('window.location.href');
  return url;
};

commands.title = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }
  return await this.executeAtom('title', [], true);
};

commands.getCookies = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  logger.debug('Retrieving all cookies');

  let script = 'return document.cookie';
  let jsCookies = await this.executeAtom('execute_script', [script, []]);

  let cookies = [];
  try {
    for (let [name, value] of _.toPairs(cookieUtils.createJWPCookie(undefined, jsCookies))) {
      cookies.push({name, value});
    }
    return cookies;
  } catch (err) {
    logger.error(err);
    throw new errors.UnknownError(`Error parsing cookies from result: '${jsCookies}'`);
  }
};

commands.setCookie = async function (cookie) {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  cookie = _.clone(cookie);

  // if `path` field is not specified, Safari will not update cookies as expected; eg issue #1708
  if (!cookie.path) {
    cookie.path = "/";
  }

  let jsCookie = cookieUtils.createJSCookie(cookie.name, cookie.value, {
    expires: _.isNumber(cookie.expiry) ? (new Date(cookie.expiry * 1000)).toUTCString() :
      cookie.expiry,
    path: cookie.path,
    domain: cookie.domain,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure
  });
  let script = `document.cookie = ${JSON.stringify(jsCookie)}`;
  await this.executeAtom('execute_script', [script, []]);
};

commands.deleteCookie = async function (cookieName) {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  // check cookie existence
  let cookies = await this.getCookies();
  if (_.indexOf(_.map(cookies, 'name'), cookieName) === -1) {
    logger.debug(`Cookie '${cookieName}' not found. Ignoring.`);
    return true;
  }

  return await this._deleteCookie(cookieName);
};

commands.deleteCookies = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  let cookies = await this.getCookies();
  if (cookies.length) {
    for (let cookie of cookies) {
      await this._deleteCookie(cookie.name);
    }
  }
  return true;
};

helpers._deleteCookie = async function (cookieName) {
  logger.debug(`Deleting cookie '${cookieName}'`);
  let webCookie = cookieUtils.expireCookie(cookieName, {path: "/"});
  let script = `document.cookie = ${JSON.stringify(webCookie)}`;
  await this.executeAtom('execute_script', [script, []]);
};

extensions.findWebElementOrElements = async function (strategy, selector, many, ctx) {
  let atomsElement = this.getAtomsElement(ctx);
  let element;
  let doFind = async () => {
    element = await this.executeAtom(`find_element${many ? 's' : ''}`, [strategy, selector, atomsElement]);
    return !_.isNull(element);
  };
  try {
    await this.implicitWaitForCondition(doFind);
  } catch (err) {
    if (err.message && _.isFunction(err.message.match) && err.message.match(/Condition unmet/)) {
      // condition was not met setting res to empty array
      element = [];
    } else {
      throw err;
    }
  }

  if (many) {
    return element;
  } else {
    if (!element || _.size(element) === 0) {
      throw new errors.NoSuchElementError();
    }
    return element;
  }
};

extensions.webFlickElement = async function (el, xoffset, yoffset) {
  let atomsElement = await this.useAtomsElement(el);

  let {x, y} = await this.executeAtom('get_top_left_coordinates', [atomsElement]);
  let {width, height} = await this.executeAtom('get_size', [atomsElement]);

  // translate to proper coordinates
  x = x + (width / 2);
  y = y + (height / 2);

  let from = await this.translateWebCoords({x, y});
  let to = await this.translateWebCoords({x: x + xoffset, y: y + yoffset});

  let args = {from, to};
  let command = `au.flick(${JSON.stringify(args)})`;
  await this.uiAutoClient.sendCommand(command);
};

extensions.mobileWebNav = async function (navType) {
  this.remote.allowNavigationWithoutReload();
  await this.executeAtom('execute_script', [`history.${navType}();`, null]);
};


extensions.nativeWebTap = async function (el) {
  let atomsElement = this.useAtomsElement(el);
  let {x, y} = await this.executeAtom('get_top_left_coordinates', [atomsElement]);
  let {width, height} = await this.executeAtom('get_size', [atomsElement]);
  x = x + (width / 2);
  y = y + (height / 2) + await this.getExtraNativeWebTapOffset();

  this.curWebCoords = {x, y};
  await this.clickWebCoords();
  // make sure real tap actually has time to register
  await B.delay(500);
};

extensions.getExtraNativeWebTapOffset = async function () {
  // this will be filled in by drivers using it
  return 0;
};

extensions.clickWebCoords = async function () {
  let coords = await this.translateWebCoords(this.curWebCoords);
  await this.clickCoords(coords);
};

extensions.translateWebCoords = async function (coords) {
  logger.debug(`Translating coordinates (${JSON.stringify(coords)}) to web coordinates`);
  let wvCmd = 'au.getElementsByType(\'webview\')';
  let webviewIndex = this.webContextIndex();

  // add static offset for safari in landscape mode
  let yOffset = this.opts.curOrientation === 'LANDSCAPE' ? this.landscapeWebCoordsOffset : 0;

  // absolutize web coords
  let webviews = await this.uiAutoClient.sendCommand(wvCmd);
  if (webviews.length < 1) {
    throw new errors.UnknownError.code('Could not find any webviews to click inside!');
  }
  if (_.isUndefined(webviews[webviewIndex])) {
    logger.warn(`Could not find webview at index ${webviewIndex}, taking ` +
                `last available one for clicking purposes`);
    webviewIndex = webviews.length - 1;
  }

  let wvId = webviews[webviewIndex].ELEMENT;
  let locCmd = `au.getElement('${wvId}').rect()`;
  let rect = await this.uiAutoClient.sendCommand(locCmd);
  let wvPos = {x: rect.origin.x, y: rect.origin.y};
  let realDims = {w: rect.size.width, h: rect.size.height};

  let cmd = '(function () { return {w: document.width, h: document.height}; })()';
  let {w, h} = await this.remote.execute(cmd);
  let wvDims = {w, h};

  if (wvDims && realDims && wvPos) {
    let xRatio = realDims.w / wvDims.w;
    let yRatio = realDims.h / wvDims.h;
    let serviceBarHeight = 20;
    if (parseFloat(this.opts.platformVersion) >= 8) {
      // ios8 includes the service bar height in the app
      serviceBarHeight = 0;
    }
    let newCoords = {
      x: wvPos.x + Math.round(xRatio * coords.x)
    , y: wvPos.y + yOffset + Math.round(yRatio * coords.y) - serviceBarHeight
    };
    logger.debug(`Converted web coords ${JSON.stringify(coords)} ` +
                `into real coords ${JSON.stringify(newCoords)}`);
    return newCoords;
  }
};

helpers.clickCoords = async function (coords) {
  if (this.useRobot) {
    // var tapUrl = this.args.robotUrl + "/tap";
    // request.post({url:tapUrl, form: {x:coords.x, y:coords.y}}, cb);
    /*TODO*/throw new errors.NotYetImplementedError();
  } else {
    let opts = coords;
    opts.tapCount = 1;
    opts.duration = 0.3;
    opts.touchCount = 1;
    let command = `au.complexTap(${JSON.stringify(opts)})`;
    await this.uiAutoClient.sendCommand(command);
  }
};

helpers.executeAtom = async function (atom, args, alwaysDefaultFrame = false) {
  let frames = alwaysDefaultFrame === true ? [] : this.curWebFrames;
  let promise = this.remote.executeAtom(atom, args, frames);
  return await this.waitForAtom(promise);
};

helpers.executeAtomAsync = async function (atom, args, responseUrl) {
  // save the resolve and reject methods of the promise to be waited for
  let promise = new B((resolve, reject) => {
    this.asyncPromise = {resolve, reject};
  });
  await this.remote.executeAtomAsync(atom, args, this.curWebFrames, responseUrl);
  return await this.waitForAtom(promise);
};

helpers.waitForAtom = async function (promise) {
  // need to check for alert while the atom is being executed.
  // so notify ourselves when it happens
  let done = false;
  let error = null;
  promise.then((res) => { // eslint-disable-line promise/prefer-await-to-then
    done = true;
    return res;
  })
  .catch((err) => { // eslint-disable-line promise/prefer-await-to-callbacks
    logger.debug(`Error received while executing atom: ${err.message}`);
    // error gets swallowed, so save and check later
    done = true;
    error = err;
  });
  // try ten times to check alert, if we are not done yet
  for (let i = 0; i < 10; i++) {
    // check if the promise has been resolved
    if (done) break; // eslint-disable-line curly
    await B.delay(500);
    if (done) break; // eslint-disable-line curly
    // check if there is an alert
    if (await this.checkForAlert()) {
      // we found an alert, and should just return control
      return '';
    }
  }

  let res = await promise;
  if (error) {
    throw error;
  }
  return this.parseExecuteResponse(res);
};

helpers.checkForAlert = async function () {
  if (!_.isNull(this.uiAutoClient)) {
    logger.debug('atom did not return yet, checking to see if ' +
                 'we are blocked by an alert');
    let present = await this.uiAutoClient.sendCommand('au.alertIsPresent()');
    if (!present) {
      logger.debug('No alert found.');
    } else {
      logger.debug('Found an alert, returning control to client');
    }
    return present;
  }
};

helpers.getAtomsElement = function (wdId) {
  let atomsId;
  try {
    atomsId = this.webElementIds[parseInt(wdId, 10) - ELEMENT_OFFSET];
  } catch (e) {
    return null;
  }
  if (_.isUndefined(atomsId)) {
    return null;
  }
  return {ELEMENT: atomsId};
};

helpers.useAtomsElement = function (el) {
  if (parseInt(el, 10) < ELEMENT_OFFSET) {
    logger.debug(`Element with id '${el}' passed in for use with ` +
                 `atoms, but it's out of our internal scope. Adding ${ELEMENT_OFFSET}.`);
    el = (parseInt(el, 10) + ELEMENT_OFFSET).toString();
  }
  let atomsElement = this.getAtomsElement(el);
  if (atomsElement === null) {
    throw new errors.UnknownError(`Error converting element ID for using in WD atoms: '${el}'`);
  }
  return atomsElement;
};

helpers.convertElementsForAtoms = function (args = []) {
  let newArgs = [];
  for (let arg of args) {
    if (!_.isNull(arg) && !_.isUndefined(arg.ELEMENT)) {
      let atomsElement = this.getAtomsElement(arg.ELEMENT);
      if (atomsElement === null) {
        throw new errors.UnknownError(`Error converting element ID for using in WD atoms: '${arg.ELEMENT}'`);
      }
      newArgs.push(atomsElement);
    } else {
      newArgs.push(arg);
    }
  }
  return newArgs;
};

helpers.parseExecuteResponse = function (res) {
  if (_.isNull(res) || _.isUndefined(res)) return null; // eslint-disable-line curly

  let wdElement = null;
  if (!_.isArray(res)) {
    if (!_.isUndefined(res.ELEMENT)) {
      wdElement = this.parseElementResponse(res);
      if (wdElement === null) {
        throw new errors.UnknownError(`Error converting element ID atom for using in WD: '${res.ELEMENT}'`);
      }
      res = wdElement;
    }
  } else {
    // value is an array, so go through and convert each
    let args = [];
    for (let arg of res) {
      wdElement = arg;
      if (!_.isNull(arg) && !_.isUndefined(arg.ELEMENT)) {
        wdElement = this.parseElementResponse(arg);
        if (wdElement === null) {
          throw new errors.UnknownError(`Error converting element ID atom for using in WD: '${arg.ELEMENT}'`);
        }
        args.push(wdElement);
      } else {
        args.push(arg);
      }
    }
    res = args;
  }
  return res;
};

helpers.parseElementResponse = function (element) {
  let objId = element.ELEMENT;
  let clientId = (ELEMENT_OFFSET + this.webElementIds.length).toString();
  this.webElementIds.push(objId);
  return {ELEMENT: clientId};
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
