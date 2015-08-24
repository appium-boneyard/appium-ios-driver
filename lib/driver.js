import { BaseDriver } from 'appium-base-driver';
import utils from './utils';
import logger from './logger';
import path from 'path';
import _ from 'lodash';
import B from 'bluebird';
import { fs } from 'appium-support';
import { getSimulator, killAllSimulators } from 'appium-ios-simulator';
import { prepareBootstrap, UIAutoClient } from 'appium-uiauto';
import { Instruments, utils as instrumentsUtils } from 'appium-instruments';
import { retry, waitForCondition } from 'asyncbox';
import { IOSLog, IOSCrashLog } from 'appium-ios-log';
import commands from './commands/index';


class IosDriver extends BaseDriver {
  resetIos () {
    this.appExt = ".app";
    this.capabilities = {
      webStorageEnabled: false
    , locationContextEnabled: false
    , browserName: 'iOS'
    , platform: 'MAC'
    , javascriptEnabled: true
    , databaseEnabled: false
    , takesScreenshot: true
    , networkConnectionEnabled: false
    };
    this.xcodeVersion = null;
    this.iosSdkVersion = null;
    this.iosSimProcess = null;
    this.iosSimUdid = null;
    this.logs = {};
    this.instruments = null;
    this.uiAutoClient = null;
    this.onInstrumentsDie = function () {};
    this.stopping = false;
    this.cbForCurrentCmd = null;
    this.remote = null;
    this.curContext = null;
    this.curWebFrames = [];
    this.selectingNewPage = false;
    this.processingRemoteCmd = false;
    this.remoteAppKey = null;
    this.windowHandleCache = [];
    this.webElementIds = [];
    this.implicitWaitMs = 0;
    this.asynclibWaitMs = 0;
    this.pageLoadMs = 60000;
    this.asynclibResponseCb = null;
    this.returnedFromExecuteAtom = {};
    this.executedAtomsCounter = 0;
    this.curCoords = null;
    this.curWebCoords = null;
    this.onPageChangeCb = null;
    this.supportedStrategies = ["name", "xpath", "id", "-ios uiautomation",
                                "class name", "accessibility id"];
    this.landscapeWebCoordsOffset = 0;
    this.keepAppToRetainPrefs = false;
    this.isShuttingDown = false;

    // TODO: some of this should be done in the driver
    this.locatorStrategies = ['xpath', 'id', 'name', 'class name', '-ios uiautomation',
      'accessibility id', '-android uiautomator'];
    this.webLocatorStrategies = ['link text', 'css selector', 'tag name', 'partial link text'];
 }

  constructor(opts, shouldValidateCaps) {
    super(opts, shouldValidateCaps);
    this.resetIos();
  }

  validateLocatorStrategy (strategy) {
    super.validateLocatorStrategy(strategy, this.isWebContext());
  }

  async createSession (caps) {
    let [sessionId] = await super.createSession(caps);

    utils.prepareIosCaps(caps);
    this.useRobot = caps.useRobot;
    this.curOrientation = caps.initialOrientation;
    this.sock = path.resolve(caps.tmpDir || '/tmp', 'instruments_sock');
    this.perfLogEnabled = !!(typeof caps.loggingPrefs === 'object' && caps.loggingPrefs.performance);

    utils.prepareIosAppCaps(caps);
    try {
      caps.app = await this.helpers.configureApp(caps.app, '.app');
    } catch (err) {
        logger.error("Bad app: " + caps.app + ". App paths need to " +
                     "be absolute, or relative to the appium server " +
                     "install dir, or a URL to compressed file, or a " +
                     "special app name.");
        throw err;
     }
    // TODO: sim or real device
    await this.startSimulator();
    return [sessionId, caps];
  }

  async deleteSession () {
    logger.debug("Deleting ios session");
    await B.all([
      this.uiAutoClient.shutdown(),
      this.instruments.shutdown()
    ]);
    this.uiAutoClient = null;
    this.instruments = null;

    // postcleanup
    this.curCoords = null;
    this.curOrientation = null;
    if (!_.isEmpty(this.logs)) {
      this.logs.syslog.stopCapture();
      this.logs = {};
    }

    // TODO
    //if (this.remote) {
      //await this.stopRemote();
    //}

    await this.runSimReset();
    this.isShuttingDown = false; // TODO: needed?
    await super.deleteSession();
  }

  async startSimulator () {
    await utils.removeInstrumentsSocket(this.sock);

    logger.debug("Setting Xcode version");
    this.xcodeVersion = await utils.getAndCheckXcodeVersion(this.caps);
    logger.debug("Xcode version set to " + this.xcodeVersion);

    logger.debug("Setting iOS SDK Version");
    this.iosSdkVersion = await utils.getAndCheckIosSdkVersion();
    logger.debug("iOS SDK Version set to " + this.iosSdkVersion);

    await this.checkSimAvailable();

    this.sim = await getSimulator(this.iosSimUdid, this.xcodeVersion);

    await utils.detectUdid(this.caps);
    await utils.parseLocalizableStrings(this.caps);

    await utils.setBundleIdFromApp(this.caps);

    await this.createInstruments();

    {
      // previously setDeviceInfo()
      this.shouldPrelaunchSimulator = utils.shouldPrelaunchSimulator(this.caps, this.iosSdkVersion);
      let dString = utils.getDeviceString(this.xcodeVersion, this.iosSdkVersion, this.caps);
      await utils.setDeviceTypeInInfoPlist(this.caps.app, dString);
    }

    await this.checkPreferences();

    await this.runSimReset();
    await this.isolateSimDevice();
    await this.setLocale();
    await this.setPreferences.bind();
    await this.startLogCapture();
    await this.prelaunchSimulator();
    await this.startInstruments();
    await this.onInstrumentsLaunch();
    await this.configureBootstrap();
    await this.setBundleId();
    await this.setInitialOrientation();
    await this.initAutoWebview();
    await this.waitForAppLaunched();
  }

  isWebContext () {
    return !!this.curContext;
  }

  async checkPreferences () {
    // TODO: this need to be splitted in 2 helpers
    let settingsCaps = [
      'locationServicesEnabled',
      'locationServicesAuthorized',
      'safariAllowPopups',
      'safariIgnoreFraudWarning',
      'safariOpenLinksInBackground'
    ];
    let safariSettingsCaps = settingsCaps.slice(2, 5);
    this.needToSetPrefs = false;
    this.needToSetSafariPrefs = false;
    _.each(settingsCaps, function (cap) {
      if (_.has(this.caps, cap)) {
        this.needToSetPrefs = true;
        if (_.contains(safariSettingsCaps, cap)) {
          this.needToSetSafariPrefs = true;
        }
      }
    }.bind(this));
    this.keepAppToRetainPrefs = this.needToSetPrefs;
  }

  async deleteSim () {
    this.sim.delete();
  }

  async clearAppData  () {
    if (!this.keepAppToRetainPrefs && this.caps.app && this.caps.bundleId) {
      // TODO: this.sim.cleanCustomApp(path.basename(this.caps.app), this.caps.bundleId);
    }
  }

  async cleanupDeviceState () {

    if (this.realDevice && this.caps.bundleId && this.caps.fullReset) {
      logger.debug("fullReset requested. Will try to uninstall the app.");
      let bundleId = this.caps.bundleId;
      try {
        // TODO await this.realDevice.remove.bind(this.realDevice, bundleId);
      } catch (err) {
        try {
          await this.removeApp(bundleId);
        } catch(err) {
          logger.error("Could not remove " + bundleId + " from device");
          throw err;
        }
        logger.debug("Removed " + bundleId);
        return;
      }
      logger.debug("Removed " + bundleId);
    } else if (!this.caps.udid) {
      try {
        await this.sim.clean();
      } catch (err) {
        logger.error("Could not reset simulator. Leaving as is. Error: " + err.message);
      }
      await this.clearAppData();
    } else {
      logger.debug("On a real device; cannot clean device state");
    }
  }

  async runSimReset () {
    if (this.caps.reset || this.caps.fullReset) {
      logger.debug("Running ios sim reset flow");
      // The simulator process must be ended before we delete applications.
      await this.endSimulator();
      if (this.caps.reset) {
        await this.cleanupDeviceState();
      }
      if (this.caps.fullReset && !this.caps.udid) {
        await this.deleteSim();
      }
    } else {
      logger.debug("Reset not set, not ending sim or cleaning up app state");
    }
  }

  async endSimulator () {
    logger.debug("Killing the simulator process");
    if (this.iosSimProcess) {
      this.iosSimProcess.kill("SIGHUP");
      this.iosSimProcess = null;
    } else {
      killAllSimulators();
    }
    await utils.endSimulatorDaemons();
  }

  async isolateSimDevice () {
    if (!this.caps.udid && this.caps.isolateSimDevice &&
        this.iosSdkVersion >= 8) {
      // TODO await this.sim.deleteOtherSims.bind(this.sim);
    }
  }

  async setLocale () {
    let msg;
    let setLoc = async () => {
      logger.debug("Setting locale information");
      let needSimRestart = false;
      this.localeConfig = this.localeConfig || {};
      _(['language', 'locale', 'calendarFormat']).each(function (key) {
        needSimRestart = needSimRestart ||
                        (this.caps[key] &&
                         this.caps[key] !== this.localeConfig[key]);
      }, this);
      this.localeConfig = {
        language: this.caps.language,
        locale: this.caps.locale,
        calendarFormat: this.caps.calendarFormat
      };
      let simRoots = this.sim.getDirs();
      if (simRoots.length < 1) {
        msg = "Cannot set locale information because the iOS Simulator directory could not be determined.";
        logger.error(msg);
        throw new Error(msg);
      }

      try {
        this.sim.setLocale(this.caps.language, this.caps.locale, this.caps.calendarFormat);
      } catch (e) {
        msg = "Appium was unable to set locale info: " + e;
        logger.error(msg);
        throw new Error(msg);
      }

      logger.debug("Locale was set");
      if (needSimRestart) {
        logger.debug("First time setting locale, or locale changed, killing existing Instruments and Sim procs.");
        killAllSimulators();
        instrumentsUtils.killAllInstruments();
        await B.delay(250);
      }
    };

    if ((this.caps.language || this.caps.locale || this.caps.calendarFormat) && this.caps.udid === null) {

      if (this.caps.fullReset && this.caps.platformVersion <= 6.1) {
        msg = "Cannot set locale information because a full-reset was requested. full-reset interferes with the language/locale caps on iOS 6.1 and older";
        logger.error(msg);
        throw new Error(msg);
      }

      if (!this.sim.dirsExist()) {
        await this.instantLaunchAndQuit(false);
      }
      await setLoc();

    } else if (this.caps.udid) {
      logger.debug("Not setting locale because we're using a real device");
    } else {
      logger.debug("Not setting locale");
    }
  }

  async setPreferences () {
    if (!this.needToSetPrefs) {
      logger.debug("No iOS / app preferences to set");
      return;
    } else if (this.caps.fullReset) {
      let msg = "Cannot set preferences because a full-reset was requested";
      logger.debug(msg);
      logger.error(msg);
      throw new Error(msg);
    }

    logger.debug("Setting iOS and app preferences");
    // TODO why this is needed?: this.sim.dirsExist

    if (this.sim.isFresh()) {
        await this.sim.launchAndQuit();
    }
    try {
      this.setLocServicesPrefs();
    } catch (e) {
      logger.error("Error setting location services preferences, prefs will not work");
      logger.error(e);
      logger.error(e.stack);
    }
    try {
      this.setSafariPrefs();
    } catch (e) {
      logger.error("Error setting safari preferences, prefs will not work");
      logger.error(e);
      logger.error(e.stack);
    }
  }

  setLocServicesPrefs () {
    if (typeof this.capabilities.locationServicesEnabled !== "undefined" ||
        this.capabilities.locationServicesAuthorized) {
      let locServ = this.capabilities.locationServicesEnabled;
      locServ = locServ || this.capabilities.locationServicesAuthorized;
      locServ = locServ ? 1 : 0;
      logger.debug("Setting location services to " + locServ);
      this.sim.updateSettings('locationServices', {
           LocationServicesEnabled: locServ,
          'LocationServicesEnabledIn7.0': locServ,
          'LocationServicesEnabledIn8.0': locServ
         }
      );
    }
    if (typeof this.capabilities.locationServicesAuthorized !== "undefined") {
      if (!this.caps.bundleId) {
        let msg = "Can't set location services for app without bundle ID";
        logger.error(msg);
        throw new Error(msg);
      }
      let locAuth = !!this.capabilities.locationServicesAuthorized;
      if (locAuth) {
        logger.debug("Authorizing location services for app");
      } else {
        logger.debug("De-authorizing location services for app");
      }
      this.sim.updateLocationSettings(this.caps.bundleId, locAuth);
    }
  }

  async startLogCapture () {
    if (!_.isEmpty(this.logs)) {
      throw new Error("Trying to start iOS log capture but it's already started!");
    }
    this.logs.crashlog = new IOSCrashLog();
    this.logs.syslog = new IOSLog({
      sim: this.sim,
      udid: this.caps.udid
    , showLogs: this.caps.showIOSLog
    });
    try {
      await this.logs.syslog.startCapture();
    } catch (err) {
      logger.warn("Could not capture logs from device. Continuing without capturing logs.");
      return;
    }
    await this.logs.crashlog.startCapture();
  }

  async prelaunchSimulator () {
    if (!this.shouldPrelaunchSimulator) {
      logger.debug("Not pre-launching simulator");
      return;
    }
    await this.endSimulator();
    // TODO: implement prelaunch sim in simulator package
  }

  async onInstrumentsLaunch () {
    logger.debug('Instruments launched. Starting poll loop for new commands.');
    if (this.caps.origAppPath) {
      logger.debug("Copying app back to its original place");
      return await fs.ncp(this.caps.app, this.caps.origAppPath);
    }
  }

  async setBundleId () {
    if (this.caps.bundleId) {
      // We already have a bundle Id
      return;
    } else {
      let bId = await this.uiAutoClient.sendCommand('au.bundleId()');
      logger.debug('Bundle ID for open app is ' + bId.value);
      this.caps.bundleId = bId.value;
    }
  }

  async setInitialOrientation () {
    if (typeof this.caps.initialOrientation === "string" &&
        _.contains(["LANDSCAPE", "PORTRAIT"],
                   this.caps.initialOrientation.toUpperCase())
        ) {
      logger.debug("Setting initial orientation to " + this.caps.initialOrientation);
      let command = ["au.setScreenOrientation('",
        this.caps.initialOrientation.toUpperCase(), "')"].join('');
      try {
        await this.uiAutoClient.sendCommand(command);
        this.curOrientation = this.caps.initialOrientation;
      } catch (err) {
        logger.warn("Setting initial orientation failed with:", err);
      }
    }
  }

  async initAutoWebview () {
    if (this.caps.autoWebview) {
      logger.debug('Setting auto webview');
      await this.navToInitialWebview.bind(this);
    }
  }

  async getContextsAndViews () {
    let webviews;
    // TODO: webviews.= await B.fromNode(this.listWebFrames.bind(this));
    let ctxs = [{id: this.NATIVE_WIN}];
    this.contexts = [this.NATIVE_WIN];
    _.each(webviews, (view) => {
      ctxs.push({id: this.WEBVIEW_BASE + view.id, view: view});
      this.contexts.push(view.id.toString());
    });
    return ctxs;
  }

  async getLatestWebviewContextForTitle (titleRegex) {
    let contexts = await this.getContextsAndViews();
    let matchingCtx;
    _(contexts).each((ctx) => {
      if (ctx.view && (ctx.view.title || "").match(titleRegex)) {
        if (ctx.view.url === "about:blank") {
          // in the case of Xcode  < 5 (i.e., iOS SDK Version less than 7)
          // and in the case of iOS 7.1 in a webview (not in Safari)
          // we can have the url be `about:blank`
          if (parseFloat(this.iosSdkVersion) < 7 ||
              (this.caps.platformVersion === '7.1' && this.caps.app && this.caps.app.toLowerCase() !== 'safari')) {
            matchingCtx = ctx;
          }
        } else {
          matchingCtx = ctx;
        }
      }
    });
    return matchingCtx ? matchingCtx.id : undefined;
  }

  // Right now we don't necessarily wait for webview
  // and frame to load, which leads to race conditions and flakiness
  // , let see if we can transition to something better
  useNewSafari () {
    return parseFloat(this.iosSdkVersion) >= 8.1 &&
           parseFloat(this.caps.platformVersion) >= 8.1 &&
           !this.caps.udid &&
           this.capabilities.safari;
  }

  async navToInitialWebview () {
    let timeout = 0;
    if (this.caps.udid) {
      timeout = 3000;
      logger.debug('Waiting for ' + timeout + ' ms before navigating to view.');
    }
    await B.delay(timeout);
    if (this.useNewSafari()) {
      await this.typeAndNavToUrl();
    } else if (parseInt(this.iosSdkVersion, 10) >= 7 && !this.caps.udid && this.capabilities.safari) {
      await this.navToViewThroughFavorites();
    } else {
      await this.navToViewWithTitle(/.*/);
    }
  }

  async typeAndNavToUrl () {
    let initialUrl = this.caps.safariInitialUrl || 'http://127.0.0.1:' + this.caps.port + '/welcome';
    let oldImpWait = this.implicitWaitMs;
    this.implicitWaitMs = 7000;
    let res = await B.fromNode(this.findElement.bind(this, 'name', 'URL'));
    this.implicitWaitMs = oldImpWait;
    await B.fromNode(this.nativeTap.bind(this, res.value.ELEMENT));
    res = await B.fromNode(this.findElements.bind(this, 'name', 'Address'));
    let addressEl = res.value[res.value.length -1].ELEMENT;
    await B.fromNode(this.setValueImmediate.bind(this, addressEl, initialUrl));
    res = await B.fromNode(this.findElement.bind(this, 'name', 'go'));
    await B.fromNode(this.nativeTap(res.value.ELEMENT));
    await this.navToViewWithTitle(/.*/i);
    // Waits for page to finish loading.
    await B.fromNode(this.remote.pageUnload.bind(this.remote));
  }

  async navToViewThroughFavorites () {
    logger.debug("We're on iOS7+ simulator: clicking apple button to get into " +
                "a webview");
    let oldImpWait = this.implicitWaitMs;
    this.implicitWaitMs = 7000; // wait 7s for apple button to exist
    try {
      let res;
      // TODO res = await B.fromNode(this.findElement.bind(this, 'xpath', '//UIAScrollView[1]/UIAButton[1]'));
      if(res.status !== 0) {
        throw new Error('Failed!');
      }
    } catch (err) {
      let msg = "Could not find button to click to get into webview. " +
                "Proceeding on the assumption we have a working one.";
      logger.error(msg);
      this.implicitWaitMs = oldImpWait;
      return await this.navToViewWithTitle(/.*/i);
    }
    this.implicitWaitMs = oldImpWait;
    try {
      let res = await B.fromNode(this.nativeTap(res.value.ELEMENT));
      if(res.status !== 0) {
        throw new Error('Failed!');
      }
    } catch (err) {
      let msg = "Could not click button to get into webview. " +
                "Proceeding on the assumption we have a working one.";
      logger.error(msg);
    }
    await this.navToViewWithTitle(/apple/i);
  }

  async navToViewWithTitle (titleRegex) {
    logger.debug("Navigating to most recently opened webview");
    let start = Date.now();
    let spinTime = 500;
    let spinHandles = async () => {
      let res;
      try {
        res = await this.getLatestWebviewContextForTitle(titleRegex);
      } catch (err) {
        throw new Error("Could not navigate to webview! Err: " + err);
      }
      if (!res) {
        if ((Date.now() - start) < 90000) {
          logger.warn("Could not find any webviews yet, refreshing/retrying");
          if (this.caps.udid || !this.capabilities.safari) {
            await B.delay(spinTime);
            return await spinHandles();
          }
          try {
            res = B.fromNode(this.findUIElementOrElements.bind(this, 'accessibility id', 'ReloadButton',
                '', false));
              if (!res || !res.value || !res.value.ELEMENT) {
                throw new Error('Invalid res!');
              }
          } catch (err) {
            logger.warn("Could not find reload button, continuing");
            await B.delay(spinTime);
            return await spinHandles();
          }
          try {
            res = await B.fromNode(this.nativeTap.bind(this, res.value.ELEMENT));
            if(!res) {
              throw new Error('Missing res!');
            }
          } catch (err) {
            logger.warn("Could not click reload button, continuing");
            await B.delay(spinTime);
            return await spinHandles();
          }
        } else {
          throw new Error("Could not navigate to webview; there aren't any!");
        }
      } else {
        let latestWindow = res;
        logger.debug("Picking webview " + latestWindow);
        await B.fromNode(this.setContext.bind(this, latestWindow));
        this.remote.cancelPageLoad();
        return;
      }
    };
    spinHandles();
  }

  async waitForAppLaunched  () {
    // on iOS8 in particular, we can get a working session before the app
    // is ready to respond to commands; in that case the source will be empty
    // so we just spin until it's not
    let condFn;
    if (this.caps.waitForAppScript) {
      // the default getSourceForElementForXML does not fit some use case, so making this customizable.
      // TODO: collect script from customer and propose several options, please comment in issue #4190.
      logger.debug("Using custom script to wait for app start:" + this.caps.waitForAppScript);
      condFn = async () => {
        let res = await this.uiAutoClient.sendCommand('try{\n' + this.caps.waitForAppScript +
                   '\n} catch(err) { $.log("waitForAppScript err: " + error); false; };');
        if(!res) {
          throw new Error('Not started yet!');
        }
      };
    } else {
      logger.debug("Waiting for app source to contain elements");
      condFn = async () => {
        try {
          let source = await this.getSourceForElementForXML();
          source = JSON.parse(source || "{}");
          let appEls = (source.UIAApplication || {})['>'];
          return appEls && appEls.length > 0 && !IosDriver.isSpringBoard(source.UIAApplication);
        } catch (e) {
          logger.warn(`Couldn't extract app element from source, error was: ${e}`);
          return false;
        }
      };
    }
    await waitForCondition(condFn, { waitMs: 10000, intervalMs: 500, logger: logger});
  }

  static isSpringBoard (uiAppObj) {
  // TODO: move to helpers
  // Test for iOS homescreen (SpringBoard). AUT occassionally start the sim, but fails to load
  // the app. If that occurs, getSourceForElementFoXML will return a doc object that meets our
  // app-check conditions, resulting in a false positive. This function tests the UiApplication
  // property's meta data to ensure that the Appium doesn't confuse SpringBoard with the app
  // under test.
    return _.propertyOf(uiAppObj['@'])('name') === 'SpringBoard';
  }

  async createInstruments () {
    logger.debug("Creating instruments");
    this.uiAutoClient = new UIAutoClient(this.sock);
    this.instruments = await this.makeInstruments();
  }

  shouldIgnoreInstrumentsExit () {
    return false;
  }

  async makeInstruments () {

    // at the moment all the logging in uiauto is at debug level
    let bootstrapPath = await prepareBootstrap({
      sock: this.sock,
      interKeyDelay: this.caps.interKeyDelay,
      justLoopInfinitely: false,
      autoAcceptAlerts: !(!this.caps.autoAcceptAlerts || this.caps.autoAcceptAlerts === 'false'),
      autoDismissAlerts: !(!this.caps.autoDismissAlerts || this.caps.autoDismissAlerts === 'false'),
      sendKeyStrategy: this.caps.sendKeyStrategy || (this.caps.udid ? 'grouped' : 'oneByOne')
    });

    let instruments = new Instruments({
      // on real devices bundleId is always used
      app: (!this.caps.udid ? this.caps.app : null) || this.caps.bundleId,
      udid: this.caps.udid,
      processArguments: this.caps.processArguments,
      ignoreStartupExit: this.shouldIgnoreInstrumentsExit(),
      bootstrap: bootstrapPath,
      template: this.caps.automationTraceTemplatePath,
      instrumentsPath: this.caps.instrumentsPath,
      withoutDelay: this.caps.withoutDelay,
      platformVersion: this.caps.platformVersion,
      webSocket: this.caps.webSocket,
      launchTimeout: this.caps.launchTimeout,
      flakeyRetries: this.caps.backendRetries,
      simulatorSdkAndDevice: this.iosSdkVersion >= 7.1 ?
        utils.getDeviceString(this.xcodeVersion, this.iosSdkVersion, this.caps) : null,
      tmpDir: path.resolve(this.caps.tmpDir || '/tmp' , 'appium-instruments'),
      traceDir: this.caps.traceDir
    });
    return instruments;
  }

  async startInstruments () {
    logger.debug("Starting UIAutoClient, and launching Instruments.");

    await B.all([
      this.uiAutoClient.start().then(() => { this.instruments.registerLaunch(); }),
      this.instruments.launch()
    ]);
  }

  async configureBootstrap () {
    logger.debug("Setting bootstrap config keys/values");
    let isVerbose = true; // TODO: level was configured according to logger
    let cmd = '';
    cmd += 'target = $.target();\n';
    cmd += 'au = $;\n';
    cmd += '$.isVerbose = ' + isVerbose + ';\n';
    // Not using uiauto grace period because of bug.
    // cmd += '$.target().setTimeout(1);\n';
    await this.uiAutoClient.sendCommand(cmd);
  }

  async checkSimAvailable () {
    if (this.caps.udid) {
      logger.debug("Not checking whether simulator is available since we're on " +
                   "a real device");
      return;
    }

    if (this.iosSdkVersion < 7.1) {
      logger.debug("Instruments v < 7.1, not checking device string support");
      return;
    }

    logger.debug("Checking whether instruments supports our device string");
    let availDevices = await retry(3, instrumentsUtils.getAvailableDevices, this.xcodeVersion,
      this.iosSdkVersion, this.caps);
    let dString = utils.getDeviceString(this.xcodeVersion, this.iosSdkVersion, this.caps);
    let noDevicesError = function () {
      let msg = "Could not find a device to launch. You requested '" +
                dString + "', but the available devices were: " +
                JSON.stringify(availDevices);
      logger.error(msg);
      throw new Error(msg);
    };
    if (this.iosSdkVersion >= 8) {
      let sim = utils.getSimForDeviceString(dString, availDevices);
      if (sim[0] === null || sim[1] === null) {
        noDevicesError();
      }
      this.iosSimUdid = sim[1];
      logger.debug("iOS sim UDID is " + this.iosSimUdid);
    } else if (!_.contains(availDevices, dString)) {
      noDevicesError();
    }
  }

  //// COMMANDS ///
  // TODO: refactor later

  async getSourceForElementForXML (ctx) {
    let source;
    if (!ctx) {
      source = await this.uiAutoClient.sendCommand("au.mainApp().getTreeForXML()");
    } else {
      source = await this.uiAutoClient.sendCommand("au.getElement('" + ctx + "').getTreeForXML()");
    }
    // TODO: all this json/xml logic is very expensive, we need
    // to use a SAX parser instead.
    if (source) {
       return JSON.stringify(source);
    } else {
      // this should never happen but we've received bug reports; this will help us track down
      // what's wrong in getTreeForXML
      throw new Error("Bad response from getTreeForXML. res was " + JSON.stringify(source));
    }
  }
}

for (let [cmd, fn] of _.pairs(commands)) {
  IosDriver.prototype[cmd] = fn;
}
export { IosDriver };
