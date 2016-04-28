import _ from 'lodash';
import B from 'bluebird';
import { retryInterval } from 'asyncbox';
import { RemoteDebugger, WebKitRemoteDebugger } from 'appium-remote-debugger';
import { IOSPerformanceLog } from 'appium-ios-log';
import { errors } from 'mobile-json-wire-protocol';
import logger from '../logger';
import { util } from 'appium-support';


const NATIVE_WIN = 'NATIVE_APP';
const WEBVIEW_WIN = 'WEBVIEW';
const WEBVIEW_BASE = `${WEBVIEW_WIN}_`;

let commands = {}, helpers = {}, extensions = {};

commands.getCurrentContext = async function () {
  if (this.curContext && this.curContext !== NATIVE_WIN) {
    return `${WEBVIEW_BASE}${this.curContext}`;
  } else {
    return NATIVE_WIN;
  }
};

commands.getContexts = async function () {
  logger.debug('Getting list of available contexts');
  let contexts = await this.getContextsAndViews(false);
  return contexts.map((context) => context.id.toString());
};

commands.setContext = async function (name, callback, skipReadyCheck) {
  function alreadyInContext (desired, current) {
    return (desired === current ||
           (desired === null && current === NATIVE_WIN) ||
           (desired === NATIVE_WIN && current === null));
  }

  logger.debug(`Attempting to set context to '${name}'`);
  if (alreadyInContext(name, this.curContext)) {
    // already in the named context, no need to do anything
  } else if (name === NATIVE_WIN || name === null) {
    // switching into the native context
    this.curContext = null;
    if (this.isRealDevice()) {
      this.remote.disconnect();
    }
  } else {
    // switching into a webview context
    let idx = name.replace(WEBVIEW_BASE, '');
    if (idx === WEBVIEW_WIN) {
      // allow user to pass in "WEBVIEW" without an index
      idx = '1';
    }

    // if contexts have not already been retrieved, get them
    if (_.isUndefined(this.contexts)) {
      await this.getContexts();
    }

    if (!_.includes(this.contexts, idx)) {
      throw new errors.NoSuchContextError();
    }
    let pageIdKey = parseInt(idx, 10);

    if (!this.isRealDevice()) {
      await this.remote.selectPage(pageIdKey, skipReadyCheck);
      this.curContext = idx;
    } else {
      if (this.remote) {
        await this.remote.disconnect();
      }
      this.curContext = idx;
      await this.remote.connect(idx);
    }
  }

  // attempt to start performance logging, if requested
  if (this.perfLogEnabled && this.remote) {
    logger.debug(`Starting performance log on '${this.curContext}'`);
    this.logs.performance = new IOSPerformanceLog(this.remote);
    this.logs.performance.startCapture();
  }
};

commands.getWindowHandle = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }
  return this.curContext.toString();
};

commands.getWindowHandles = async function () {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  let pageArray = await this.listWebFrames();
  this.windowHandleCache = _.map(pageArray, this.massagePage);
  let idArray = _.map(this.windowHandleCache, 'id');
  // since we use this.contexts to manage selecting debugger pages, make
  // sure it gets populated even if someone did not use the
  // getContexts method
  if (!this.contexts) {
    this.contexts = idArray;
  }
  return _.map(idArray, id => id.toString());
};

commands.setWindow = async function (name, skipReadyCheck) {
  if (!this.isWebContext()) {
    throw new errors.NotImplementedError();
  }

  if (!_.includes(_.map(this.windowHandleCache, 'id'), name)) {
    throw new errors.NoSuchWindowError();
  }
  let pageIdKey = parseInt(name, 10);
  if (!this.isRealDevice()) {
    await this.remote.selectPage(pageIdKey, skipReadyCheck);
    this.curContext = this.curWindowHandle = name;
  } else {
    if (name === this.curWindowHandle) {
      logger.debug(`Remote debugger is already connected to window '${name}'`);
    } else if (!_.includes(_.map(this.windowHandleCache, 'id'), name)) {
      throw new errors.NoSuchWindowError();
    } else {
      await this.remote.disconnect();
      this.curContext = this.curWindowHandle = name;
      await this.remote.connect(name);
    }
  }
};

helpers.webContextIndex = function () {
  return this.curContext.replace(WEBVIEW_BASE, '') - 1;
};

extensions.initAutoWebview = async function () {
  if (this.opts.autoWebview) {
    logger.debug('Setting auto webview');
    await this.navToInitialWebview(this);
  }
};

extensions.getContextsAndViews = async function (useUrl = true) {
  logger.debug('Retrieving contexts and views');
  let webviews = await this.listWebFrames(useUrl);
  let ctxs = [{id: NATIVE_WIN}];
  this.contexts = [NATIVE_WIN];
  for (let view of webviews) {
    ctxs.push({id: `${WEBVIEW_BASE}${view.id}`, view});
    this.contexts.push(view.id.toString());
  }
  return ctxs;
};

extensions.listWebFrames = async function (useUrl = true) {
  if (!this.opts.bundleId) {
    logger.errorAndThrow('Cannot enter web frame without a bundle ID');
  }

  /* jshint ignore:start */
  logger.debug(`Selecting by url: ${useUrl} ${useUrl ? `(expected url: '${this.getCurrentUrl()}')` : ''}`);
  /* jshint ignore:end */

  let currentUrl = useUrl ? this.getCurrentUrl() : undefined;
  let pageArray;
  if (this.isRealDevice() && this.remote && this.opts.bundleId) {
    // real device, and already connected
    pageArray = await this.remote.pageArrayFromJson();
  } else if (this.remote && this.remote.appIdKey) {
    // simulator, and already connected
    pageArray = await this.remote.selectApp(currentUrl, this.opts.webviewConnectRetries);
  } else if (this.isRealDevice()) {
    // real device, and not connected
    this.remote = new WebKitRemoteDebugger({port: this.opts.webkitDebugProxyPort});
    pageArray = await this.remote.pageArrayFromJson();
  } else {
    // simulator, and not connected
    this.remote = new RemoteDebugger({
      bundleId: this.opts.bundleId,
      useNewSafari: this.useNewSafari(),
      pageLoadMs: this.pageLoadMs,
      platformVersion: this.opts.platformVersion
    });

    let appInfo = await this.remote.connect();
    if (!appInfo) {
      logger.debug('Unable to connect to the remote debugger.');
      return [];
    }
    pageArray = await this.remote.selectApp(currentUrl, this.opts.webviewConnectRetries);
    this.remote.on(RemoteDebugger.EVENT_PAGE_CHANGE, this.onPageChange.bind(this));

    let tryClosingAlert = async () => {
      let didDismiss = await this.closeAlertBeforeTest();
      if (!didDismiss) {
        throw new Error('Close alert failed. Retry.');
      }
    };
    try {
      await retryInterval(3, 4000, tryClosingAlert);
    } catch (err) {
      // if the loop to close alerts failed to dismiss, ignore,
      // otherwise log and throw the error
      if (err.message !== 'Close alert failed. Retry.') {
        logger.errorAndThrow(err);
      }
    }
  }

  if (pageArray.length === 0) {
    // we have no web frames, but continue anyway
    logger.debug('No web frames found.');
  }
  return pageArray;
};

extensions.onPageChange = async function (pageArray) {
  logger.debug(`Remote debugger notified us of a new page listing: ${JSON.stringify(pageArray)}`);
  if (this.selectingNewPage) {
    logger.debug('We are in the middle of selecting a page, ignoring');
    return;
  }
  let newIds = [];
  let newPages = [];
  let keyId = null;
  for (let page of pageArray) {
    let id = page.id.toString();
    newIds.push(id);
    if (page.isKey) {
      keyId = id;
    }
    if (!_.includes(this.contexts, id)) {
      newPages.push(id);
      this.contexts.push(id);
    }
  }

  let newPage = null;
  if (this.curContext === null) {
    logger.debug('We do not appear to have window set yet, ignoring');
  } else if (newPages.length) {
    logger.debug(`We have new pages, going to select page '${newPages[0]}'`);
    newPage = newPages[0];
  } else if (!_.includes(newIds, this.curContext.toString())) {
    logger.debug('New page listing from remote debugger does not contain ' +
                 'current window; assuming it is closed');
    if (keyId !== null) {
      logger.debug(`Debugger already selected page '${keyId}', ` +
                   `confirming that choice.`);
    } else {
      logger.error('Do not have our current window anymore, and there ' +
                   'are not any more to load! Doing nothing...');
      this.setCurrentUrl(undefined);
      return;
    }
    this.curContext = keyId;
    newPage = keyId;
  } else {
    // If a window navigates to an anchor it doesn't always fire a page
    // callback event. Let's check if we wound up in such a situation.
    let needsPageLoad = (() => {
      let item = (arr) => {
        return _.filter(arr, (obj) => {
          return obj.id === this.curContext;
        })[0];
      };

      return !_.isEqual(item(this.contexts), item(pageArray));
    })();

    if (needsPageLoad) {
      await this.remote.pageLoad();
    }

    logger.debug('New page listing is same as old, doing nothing');
  }

  // make sure that the page listing isn't indicating a redirect
  if (util.hasValue(this.curContext)) {
    let page = _.find(pageArray, (p) => {
      return parseInt(p.id, 10) === parseInt(this.curContext, 10);
    });
    if (page && page.url !== this.getCurrentUrl()) {
      logger.debug(`Redirected from '${this.getCurrentUrl()}' to '${page.url}'`);
      this.setCurrentUrl(page.url);
    }
  }

  if (util.hasValue(newPage)) {
    this.selectingNewPage = true;
    await this.remote.selectPage(parseInt(newPage, 10));
    this.selectingNewPage = false;
    this.curContext = newPage;
  }
  this.windowHandleCache = _.map(pageArray, this.massagePage);
};

extensions.getLatestWebviewContextForTitle = async function (titleRegex) {
  let contexts = await this.getContextsAndViews();
  let matchingCtx;
  for (let ctx of contexts) {
    if (ctx.view && (ctx.view.title || '').match(titleRegex)) {
      if (ctx.view.url !== 'about:blank') {
        matchingCtx = ctx;
      } else {
        // in the cases of Xcode < 5 (i.e., iOS SDK Version less than 7)
        // iOS 7.1, iOS 9.0 & iOS 9.1 in a webview (not in Safari)
        // we can have the url be `about:blank`
        if (parseFloat(this.iOSSDKVersion) < 7 || parseFloat(this.iOSSDKVersion) >= 9 ||
            (this.opts.platformVersion === '7.1' && this.opts.app && this.opts.app.toLowerCase() !== 'safari')) {
          matchingCtx = ctx;
        }
      }
    }
  }
  return matchingCtx ? matchingCtx.id : undefined;
};

// Right now we don't necessarily wait for webview
// and frame to load, which leads to race conditions and flakiness,
// let's see if we can transition to something better
extensions.useNewSafari = function () {
  return parseFloat(this.iosSdkVersion) >= 8.1 &&
         parseFloat(this.opts.platformVersion) >= 8.1 &&
         !this.isRealDevice() &&
         this.opts.safari;
};

extensions.navToInitialWebview = async function () {
  let timeout = 0;
  if (this.isRealDevice()) {
    timeout = 3000;
    logger.debug(`Waiting for ${timeout} ms before navigating to view.`);
  }
  await B.delay(timeout);
  if (this.useNewSafari()) {
    await this.typeAndNavToUrl();
  } else if (parseInt(this.iosSdkVersion, 10) >= 7 && !this.isRealDevice() && this.opts.safari) {
    await this.navToViewThroughFavorites();
  } else {
    await this.navToViewWithTitle(/.*/);
  }
};

extensions.typeAndNavToUrl = async function () {
  this.setCurrentUrl(this.caps.safariInitialUrl || `http://127.0.0.1:${this.opts.port}/welcome`);

  let tries = 0;
  const MAX_TRIES = 2;
  let navigate = async () => {
    let oldImpWait = this.implicitWaitMs;
    this.implicitWaitMs = 7000;

    // find the url bar, and tap on it. retry to make sure we don't try
    // too soon while the view is still loading
    let el = await retryInterval(3, 1000, async () => {
      return await this.findElement('accessibility id', 'URL');
    });
    this.implicitWaitMs = oldImpWait;

    try {
      await this.nativeTap(el.ELEMENT);
    } catch (err) {
      if (_.includes(err.message, 'could not be tapped')) {
        if (tries++ >= MAX_TRIES) throw err;

        // generally this means that Safari is in page viewing mode
        // so try to open a new page and then redo the navigation
        let newPageButton = await this.findElement('xpath', "//UIAButton[contains(@name,'New page')]");
        await this.nativeTap(newPageButton.ELEMENT);
        return await navigate();
      } else {
        throw err;
      }
    }

    // get the last address element and set the url
    // this is flakey on certain systems so we retry until we get something
    let elId = await retryInterval(5, 1000, async () => {
      let el = _.last(await this.findElements('class name', 'UIATextField'));
      return el.ELEMENT;
    });
    await this.setValueImmediate(this.getCurrentUrl(), elId);

    // make it happen
    el = await this.findElement('accessibility id', 'Go');
    await this.nativeTap(el.ELEMENT);
    await this.navToViewWithTitle(/.*/i);

    // wait for page to finish loading.
    await this.remote.pageUnload();
  };
  await navigate();
};

extensions.navToViewThroughFavorites = async function () {
  logger.debug('We are on iOS7+ simulator: clicking apple button to get into a webview');
  let oldImpWait = this.implicitWaitMs;
  this.implicitWaitMs = 7000; // wait 7s for apple button to exist

  let el;
  try {
    el = await this.findElement('xpath', '//UIAScrollView[1]/UIAButton[1]');
  } catch (err) {
    let msg = 'Could not find button to click to get into webview. ' +
              'Proceeding on the assumption we have a working one.';
    logger.error(msg);
    this.implicitWaitMs = oldImpWait;
    return await this.navToViewWithTitle(/.*/i);
  }
  this.implicitWaitMs = oldImpWait;
  try {
    await this.nativeTap(el.ELEMENT);
  } catch (err) {
    let msg = 'Could not click button to get into webview. ' +
              'Proceeding on the assumption we have a working one.';
    logger.error(msg);
  }
  await this.navToViewWithTitle(/apple/i);
};

extensions.navToViewWithTitle = async function (titleRegex) {
  logger.debug('Navigating to most recently opened webview');
  let start = Date.now();
  let spinTime = 500;
  let spinHandles = async () => {
    let res;
    try {
      res = await this.getLatestWebviewContextForTitle(titleRegex);
    } catch (err) {
      if (err.message.indexOf('Could not connect to a valid app after') === -1) {
        throw new Error(`Could not navigate to webview! Err: ${err.message}`);
      }
      logger.debug('Could not navigate to webview. Retrying if possible.');
    }
    if (res) {
      let latestWindow = res;
      logger.debug(`Picking webview '${latestWindow}'`);
      await this.setContext(latestWindow);
      await this.remote.cancelPageLoad();
      return;
    }

    // no webview was found
    if ((Date.now() - start) >= 90000) {
      // too slow, get out
      throw new Error('Could not navigate to webview; there are none!');
    }

    logger.warn("Could not find any webviews yet, refreshing/retrying");
    if (this.isRealDevice() || !this.opts.safari) {
      // on a real device, when not using Safari, we just want to try again
      await B.delay(spinTime);
      return await spinHandles();
    }

    // find the reload button and tap it, if possible
    let element;
    try {
      logger.debug('Finding and tapping reload button');
      element = await this.findUIElementOrElements('accessibility id', 'ReloadButton', '', false);
      await this.nativeTap(element.ELEMENT);
    } catch (err) {
      logger.warn(`Error finding and tapping reload button: ${err.message}`);
      logger.warn('Retrying.');
      await B.delay(spinTime);
    }

    // try it all again
    return await spinHandles();
  };
  await spinHandles();
};

helpers.closeAlertBeforeTest = async function () {
  let present = await this.uiAutoClient.sendCommand('au.alertIsPresent()');
  if (!present) {
    return false;
  }

  logger.debug('Alert present before starting test, let us banish it');
  await this.uiAutoClient.sendCommand('au.dismissAlert()');
  logger.debug('Alert banished!');
  return true;
};

helpers.stopRemote = async function (closeWindowBeforeDisconnecting = false) {
  if (!this.remote) {
    logger.errorAndThrow('Tried to leave a web frame but were not in one');
  }

  if (closeWindowBeforeDisconnecting) {
    await this.closeWindow();
  }
  await this.remote.disconnect();
  this.curContext = null;
  this.curWebFrames = [];
  this.curWebCoords = null;
  this.remote = null;
};

helpers.isWebContext = function () {
  return !!this.curContext && this.curContext !== NATIVE_WIN;
};

helpers.setCurrentUrl = function (url) {
  this._currentUrl = url;
};

helpers.getCurrentUrl = function () {
  return this._currentUrl;
};


Object.assign(extensions, commands, helpers);
export { commands, helpers, NATIVE_WIN, WEBVIEW_WIN, WEBVIEW_BASE };
export default extensions;
