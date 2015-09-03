import { retryInterval } from 'asyncbox';
import _ from 'lodash';
import { errors } from 'mobile-json-wire-protocol';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

const ELEMENT_OFFSET = 5000;

commands.setUrl = async function (url) {
  logger.debug(`Attempting to set url '${url}'`);
  if (!this.isWebContext()) {
    // in the future, detect whether we have a UIWebView that we can use to
    // make sense of this command. For now, and otherwise, it's a no-op
    throw new errors.NotImplementedError();
  }
  // make sure to clear out any leftover web frames
  this.curWebFrames = [];
  await this.remote.navToUrl(url);
};

commands.getUrl = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }
  return await this.remote.execute('window.location.href');
};

commands.title = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }
  return await this.executeAtom('title', []);
};

commands.findWebElementOrElements = async function (strategy, selector, ctx, many) {
  let atomsElement = this.getAtomsElement(ctx);
  let element;
  let doFind = async () => {
    element = await this.executeAtom(`find_element${many ? 's' : ''}`, [strategy, selector, atomsElement]);
    return !_.isNull(element);
  };
  await this.implicitWaitForCondition(doFind);

  if (many) {
    return element;
  } else {
    if (!element || _.size(element) === 0) {
      throw new errors.NoSuchElementError();
    }
    return element;
  }
};

commands.webClick = async function (el) {
  let atomsElement = this.useAtomsElement(el);
  return await this.executeAtom('click', [atomsElement]);
};

helpers.executeAtom = async function (atom, args, alwaysDefaultFrame = true) {
  let counter = this.executedAtomsCounter++;
  let frames = alwaysDefaultFrame === true ? [] : this.curWebFrames;
  this.returnedFromExecuteAtom[counter] = false;
  let res = await this.remote.executeAtom(atom, args, frames);
  if (!this.returnedFromExecuteAtom[counter]) {
    this.returnedFromExecuteAtom[counter] = true;
    res = this.parseExecuteResponse(res);
  } else {
    // try to get rid of any alert 10 times, with 5s interval
    await retryInterval(10, 5000, this.lookForAlert.bind(this), counter);
  }

  return res;
};

helpers.lookForAlert = async function (counter) {
  if (!_.isNull(this.instruments) && !_.isNull(this.uiAutoClient)) {
    if (!this.returnedFromExecuteAtom[counter] && !this.selectingNewPage) {
      logger.debug('atom did not return yet, checking to see if ' +
                   'we are blocked by an alert');
      let present = await this.uiAutoClient.sendCommand('au.alertIsPresent()');
      if (!present) {
        throw new Error('No alert found. Retry.');
      }
      logger.debug('Found an alert, returning control to client');
      this.returnedFromExecuteAtom[counter] = true;
    }
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
    throw new errors.UnknownError(`Error converting element ID for using in WD atoms: ${el}`);
  }
  return atomsElement;
};

helpers.convertElementForAtoms = function (args) {
  let newArgs = [];
  for (let arg of args) {
    if (!_.isNull(arg) && !_.isUndefined(arg.ELEMENT)) {
      let atomsElement = this.getAtomsElement(arg.ELEMENT);
      if (atomsElement === null) {
        throw new errors.UnknownError(`Error converting element ID for using in WD atoms: ${arg.ELEMENT}`);
      }
      newArgs.push(atomsElement);
    }
  }
  return newArgs;
};

helpers.parseExecuteResponse = function (res) {
  let wdElement = null;
  if (!_.isArray(res)) {
    if (!_.isUndefined(res.ELEMENT)) {
      wdElement = this.parseElementResponse(res);
      if (wdElement === null) {
        throw new errors.UnknownError(`Error converting element ID atom for using in WD: ${res.ELEMENT}`);
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
          throw new errors.UnknownError(`Error converting element ID atom for using in WD: ${arg.ELEMENT}`);
        }
        args.push(wdElement);
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
