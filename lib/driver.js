import { BaseDriver } from 'appium-base-driver';
import utils from './utils';
import logger from './logger';
import path from 'path';
import _ from 'lodash';
import B from 'bluebird';
import { fs } from 'appium-support';
import { getSimulator, killAllSimulators, getDeviceString, endAllSimulatorDaemons } from 'appium-ios-simulator';
import { prepareBootstrap, UIAutoClient } from 'appium-uiauto';
import { Instruments, utils as instrumentsUtils } from 'appium-instruments';
import { retry, waitForCondition } from 'asyncbox';
import { IOSLog, IOSCrashLog } from 'appium-ios-log';
import commands from './commands/index';
import desiredCapConstraints from './desired-caps';
import { errors } from 'mobile-json-wire-protocol';
import _iDevice from 'node-idevice';
import { SAFARI_BUNDLE } from './commands/safari';
import { install, needsInstall } from './safari-launcher';

// promisify _iDevice
let iDevice = function (...args) {
  let device = _iDevice(...args);
  let promisified = {};
  for (let m of ['install', 'installAndWait', 'remove', 'isInstalled']) {
    promisified[m] = B.promisify(device[m].bind(device));
  }
  return promisified;
};

class IosDriver extends BaseDriver {
  resetIos () {
    this.appExt = ".app";
    _.defaults(this.opts, {
      webStorageEnabled: false
    , locationContextEnabled: false
    , browserName: 'iOS'
    , platform: 'MAC'
    , javascriptEnabled: true
    , databaseEnabled: false
    , takesScreenshot: true
    , networkConnectionEnabled: false
    });
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
    this.remoteAppKey = null;
    this.windowHandleCache = [];
    this.webElementIds = [];
    this.implicitWaitMs = 0;
    this.asynclibWaitMs = 0;
    this.pageLoadMs = 6000;
    this.asynclibResponseCb = null;
    this.returnedFromExecuteAtom = {};
    this.executedAtomsCounter = 0;
    this.curCoords = null;
    this.curWebCoords = null;
    this.supportedStrategies = ["name", "xpath", "id", "-ios uiautomation",
                                "class name", "accessibility id"];
    this.landscapeWebCoordsOffset = 0;
    this.keepAppToRetainPrefs = false;
    this.ready = false;
    this.asyncWaitMs = 0;

    // TODO: some of this should be done in the driver
    this.locatorStrategies = ['xpath', 'id', 'name', 'class name', '-ios uiautomation',
      'accessibility id', '-android uiautomator'];
    this.webLocatorStrategies = ['link text', 'css selector', 'tag name', 'partial link text'];
  }

  constructor(opts, shouldValidateCaps) {
    super(opts, shouldValidateCaps);

    this.desiredCapConstraints = desiredCapConstraints;
    this.resetIos();
  }

  validateLocatorStrategy (strategy) {
    super.validateLocatorStrategy(strategy, this.isWebContext());
  }

  async start() {
    if (this.opts.udid) {
      await this.startRealDevice();
    } else {
      await this.startSimulator();
    }
    this.ready = true;
  }

  async createSession (caps) {
    let [sessionId] = await super.createSession(caps);

    await utils.detectUdid(this.opts);
    utils.prepareIosOpts(this.opts);
    this.realDevice = null;
    this.useRobot = this.opts.useRobot;
    this.safari = this.opts.safari;
    this.curOrientation = this.opts.initialOrientation;

    this.sock = path.resolve(this.opts.tmpDir || '/tmp', 'instruments_sock');
    this.perfLogEnabled = !!(typeof this.opts.loggingPrefs === 'object' && this.opts.loggingPrefs.performance);
    try {
      await this.configureApp();
    } catch (err) {
        logger.error(`Bad app: '${this.opts.app}'. App paths need to ` +
                     `be absolute, or relative to the appium server ` +
                     `install dir, or a URL to compressed file, or a ` +
                     `special app name.`);
        throw err;
     }
    await this.start();

    // TODO: this should be in BaseDriver.postCreateSession
    this.startNewCommandTimeout('createSession');
    return [sessionId, this.opts];
  }

  async stop() {
    this.ready = false;
    let stopPromises = [];
    if (this.uiAutoClient) stopPromises.push(this.uiAutoClient.shutdown());
    if (this.instruments) stopPromises.push(this.instruments.shutdown());
    await B.all(stopPromises);
    this.uiAutoClient = null;
    this.instruments = null;
    this.realDevice = null;

    // postcleanup
    this.curCoords = null;
    this.opts.curOrientation = null;
    if (!_.isEmpty(this.logs)) {
      this.logs.syslog.stopCapture();
      this.logs = {};
    }

    if (this.remote) {
      await this.stopRemote();
    }

  }

  async deleteSession () {
    logger.debug("Deleting ios session");

    await this.stop();

    if (this.isRealDevice()) {
      await this.runRealDeviceReset();
    } else {
      await this.runSimReset();
    }
    await super.deleteSession();
  }

  async executeCommand (cmd, ...args) {
    logger.debug(`Executing iOS command '${cmd}'`);
    if (cmd === 'receiveAsyncResponse') {
      return await this.receiveAsyncResponse(...args);
    } else if (this.ready || _.includes(['launchApp'], cmd)) {
      return await super.executeCommand(cmd, ...args);
    }

    throw new errors.NoSuchDriverError(`Driver is not ready, cannot execute ${cmd}.`);
  }

  // TODO: reformat this.helpers + configureApp
  async configureApp () {
    try {
      // if the app name is a bundleId assign it to the bundleId property
      if (!this.opts.bundleId && utils.appIsPackageOrBundle(this.opts.app)) {
        this.opts.bundleId = this.opts.app;
      }

      if (this.opts.app && this.opts.app.toLowerCase() === "settings") {
        if (parseFloat(this.opts.platformVersion) >= 8) {
          logger.debug("We are on iOS8+ so not copying preferences app");
          this.opts.bundleId = "com.apple.Preferences";
          this.opts.app = null;
        }
      } else if (this.isSafari()) {
        if (!this.isRealDevice()) {
          if (parseFloat(this.opts.platformVersion) >= 8) {
            logger.debug("We are on iOS8+ so not copying Safari app");
            this.opts.bundleId = SAFARI_BUNDLE;
            this.opts.app = null;
          }
        } else {
          // on real device, need to check if safari launcher exists
          if (this.safari && (await needsInstall())) {
            logger.debug('SafariLauncher not found, installing...');
            await install();
            this.opts.bundleId = 'com.bytearc.SafariLauncher';
          }
        }
      } else if (this.opts.bundleId &&
                 utils.appIsPackageOrBundle(this.opts.bundleId) &&
                 (this.opts.app === "" || utils.appIsPackageOrBundle(this.opts.app))) {
        // we have a bundle ID, but no app, or app is also a bundle
        logger.debug("App is an iOS bundle, will attempt to run as pre-existing");
      } else {
        this.opts.app = await this.helpers.configureApp(this.opts.app, '.app');
      }
    } catch (err) {
        logger.error(err);
        throw new Error(
          `Bad app: ${this.opts.app}. App paths need to be absolute, or relative to the appium ` +
          "server install dir, or a URL to compressed file, or a special app name.");
     }
  }

  async startSimulator () {
    await utils.removeInstrumentsSocket(this.sock);

    logger.debug("Setting Xcode version");
    this.xcodeVersion = await utils.getAndCheckXcodeVersion(this.opts);
    logger.debug(`Xcode version set to ${this.xcodeVersion}`);

    logger.debug("Setting iOS SDK Version");
    this.iosSdkVersion = await utils.getAndCheckIosSdkVersion();
    logger.debug(`iOS SDK Version set to ${this.iosSdkVersion}`);

    await this.checkSimAvailable();

    this.sim = await getSimulator(this.iosSimUdid, this.xcodeVersion);

    await utils.parseLocalizableStrings(this.opts);

    await utils.setBundleIdFromApp(this.opts);

    await this.createInstruments();

    {
      // previously setDeviceInfo()
      this.shouldPrelaunchSimulator = utils.shouldPrelaunchSimulator(this.opts, this.iosSdkVersion);
      let dString = await this.adjustedDeviceName();
      if (this.caps.app) {
        await utils.setDeviceTypeInInfoPlist(this.opts.app, dString);
      }
    }

    await this.checkPreferences();

    await this.runSimReset();
    await this.isolateSimDevice();
    await this.setLocale();
    await this.setPreferences();
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

  async startRealDevice () {
    await utils.removeInstrumentsSocket(this.sock);
    utils.parseLocalizableStrings(this.opts);
    await utils.setBundleIdFromApp(this.opts);
    await this.createInstruments();
    await this.runRealDeviceReset();
    await this.startLogCapture();
    await this.installToRealDevice();
    await this.startInstruments();
    await this.onInstrumentsLaunch();
    await this.configureBootstrap();
    await this.setBundleId();
    await this.setInitialOrientation();
    await this.initAutoWebview();
    await this.waitForAppLaunched();
  }

  async installToRealDevice () {
    // get a real device object to deal with incoming queries
    this.realDevice = this.getIDeviceObj();

    // if user has passed in desiredCaps.autoLaunch = false
    // meaning they will manage app install / launching
    if (this.opts.autoLaunch === false) {
      return;
    }

    if (this.opts.udid) {
      if (await this.realDevice.isInstalled(this.opts.bundleId)) {
        logger.debug("App is installed.");
        if (this.opts.fullReset) {
          logger.debug("fullReset requested. Forcing app install.");
        } else {
          logger.debug("fullReset not requested. No need to install.");
          return;
        }
      } else {
        logger.debug("App is not installed. Will try to install the app.");
      }
      if (this.opts.ipa && this.opts.bundleId) {
        await this.installIpa();
      } else if (this.opts.ipa) {
        let msg = "You specified a UDID and ipa but did not include the bundle id";
        logger.warn(msg);
        throw new errors.UnknownError(msg);
      } else if (this.opts.app) {
        await this.realDevice.install(this.opts.app);
      } else {
        logger.debug("Real device specified but no ipa or app path, assuming bundle ID is " +
                     "on device");
      }
    } else {
      logger.debug("No device id or app, not installing to real device.");
    }
  }

  getIDeviceObj () {
    let idiPath = path.resolve(__dirname, "../../../build/",
                               "libimobiledevice-macosx/ideviceinstaller");
    logger.debug("Creating iDevice object with udid " + this.opts.udid);
    try {
      return iDevice(this.opts.udid);
    } catch (e1) {
      logger.debug("Couldn't find ideviceinstaller, trying built-in at " +
                  idiPath);
      try {
        return iDevice(this.opts.udid, {cmd: idiPath});
      } catch (e2) {
        let msg = "Could not initialize ideviceinstaller; make sure it is " +
                  "installed and works on your system";
        logger.error(msg);
        throw new Error(msg);
      }
    }
  }

  async installIpa () {
    logger.debug("Installing ipa found at " + this.opts.ipa);
    if (await this.realDevice.isInstalled(this.opts.bundleId)) {
      logger.debug("Bundle found on device, removing before reinstalling.");
      await this.realDevice.remove(this.opts.bundleId);
    } else {
      logger.debug("Nothing found on device, going ahead and installing.");
    }
    await this.realDevice.installAndWait(this.opts.ipa, this.opts.bundleId);
  }

  validateDesiredCaps (caps) {
    // check with the base class, and return if it fails
    let res = super.validateDesiredCaps(caps);
    if (!res) return res;

    // make sure that the capabilities have one of `app` or `bundleId`
    if ((caps.browserName || '').toLowerCase() !== 'safari' &&
        !caps.app && ! caps.bundleId) {
      let msg = 'The desired capabilities must include either an app or a bundleId for iOS';
      logger.errorAndThrow(msg);
    }

    // `launchTimeout` is more complex than the validators can easily handle
    // and too specific for a generalized validator of its own
    if (caps.launchTimeout) {
      // it can be a number, a JSON string, or an object
      let msg = 'launchTimeout must be a number, object, or string JSON object';
      if (!_.isNumber(caps.launchTimeout)) {
        if (_.isString(caps.launchTimeout)) {
          // if this is a string, it must be a JSON string
          try {
            // change `launchTimeout` to an object
            caps.launchTimeout = JSON.parse(caps.launchTimeout);
          } catch (err) {
            // it was a string, but not something parsable as JSON
            logger.errorAndThrow(msg);
          }
        }
        if (!_.isObject(caps.launchTimeout)) {
          logger.errorAndThrow(msg);
        }
      }
    }

    // finally, return true since the superclass check passed, as did this
    return true;
  }

  async checkPreferences () {
    // TODO: this need to be split in 2 helpers
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
    for (let cap of settingsCaps) {
      if (_.has(this.opts, cap)) {
        this.needToSetPrefs = true;
        if (_.contains(safariSettingsCaps, cap)) {
          this.needToSetSafariPrefs = true;
        }
      }
    }
    this.keepAppToRetainPrefs = this.needToSetPrefs;
  }

  async deleteSim () {
    await this.sim.delete();
  }

  async clearAppData  () {
    if (!this.keepAppToRetainPrefs && this.opts.app && this.opts.bundleId) {
      // TODO: this.sim.cleanCustomApp(path.basename(this.opts.app), this.opts.bundleId);
    }
  }

  async cleanupDeviceState () {
    if (this.realDevice && this.opts.bundleId && this.opts.fullReset) {
      logger.debug("fullReset requested. Will try to uninstall the app.");
      let bundleId = this.opts.bundleId;
      try {
        await this.realDevice.remove(bundleId);
      } catch (err) {
        logger.error("Could not remove " + bundleId + " from device");
        throw err;
      }
      logger.debug("Removed " + bundleId);
    } else if (!this.opts.udid) {
      if (this.sim) {
        logger.debug('Cleaning sim state.');
        try {
          await this.sim.clean();
        } catch (err) {
          logger.warn(err);
          logger.warn("Could not reset simulator. Leaving as is.");
        }
        await this.clearAppData();
      }
    }
  }

  async runRealDeviceReset () {
    if (this.opts.reset || this.opts.fullReset) {
      logger.debug("Running ios real device reset flow");
      if (this.opts.reset) {
        await this.cleanupDeviceState();
      }
    } else {
      logger.debug("Reset not set, not ending real device");
    }
  }

  async runSimReset () {
    if (this.opts.reset || this.opts.fullReset) {
      logger.debug("Running ios sim reset flow");
      // The simulator process must be ended before we delete applications.
      await this.endSimulator();
      if (this.opts.reset) {
        await this.cleanupDeviceState();
      }
      if (this.opts.fullReset && !this.opts.udid) {
        await this.deleteSim();
      }
    } else {
      logger.debug("Reset not set, not ending sim");
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
    await endAllSimulatorDaemons();
  }

  async isolateSimDevice () {
    if (!this.opts.udid && this.opts.isolateSimDevice &&
        this.iosSdkVersion >= 8) {
      // TODO await this.sim.deleteOtherSims.bind(this.sim);
    }
  }

  async launchAndQuitSimulator () {
    logger.debug('No simulator directories found.');
    return await this.sim.launchAndQuit(this.isSafari());
  }

  async setLocale () {
    let msg;
    let setLoc = async () => {
      logger.debug("Setting locale information");
      let needSimRestart = false;
      this.localeConfig = this.localeConfig || {};
      _(['language', 'locale', 'calendarFormat']).each(function (key) {
        needSimRestart = needSimRestart ||
                        (this.opts[key] &&
                         this.opts[key] !== this.localeConfig[key]);
      }, this);
      this.localeConfig = {
        language: this.opts.language,
        locale: this.opts.locale,
        calendarFormat: this.opts.calendarFormat
      };

      // TODO: this should not be needed anymore, check with @imurchie
      //let simRoots = this.sim.getDirs();
      //if (simRoots.length < 1) {
        //msg = "Cannot set locale information because the iOS Simulator directory could not be determined.";
        //logger.error(msg);
        //throw new Error(msg);
      //}

      try {
        await this.sim.updateLocale(this.opts.language, this.opts.locale, this.opts.calendarFormat);
      } catch (e) {
        msg = "Appium was unable to set locale info: " + e;
        logger.error(msg);
        throw new Error(msg);
      }

      logger.debug("Locale was set");
      if (needSimRestart) {
        logger.debug("First time setting locale, or locale changed, killing existing Instruments and Sim procs.");
        await killAllSimulators();
        await instrumentsUtils.killAllInstruments();
        await B.delay(250);
      }
    };


    if ((this.opts.language || this.opts.locale || this.opts.calendarFormat) && (_.isNull(this.opts.udid) || _.isUndefined(this.opts.udid))) {

      if (this.opts.fullReset && this.opts.platformVersion <= 6.1) {
        msg = "Cannot set locale information because a full-reset was requested. full-reset interferes with the language/locale caps on iOS 6.1 and older";
        logger.error(msg);
        throw new Error(msg);
      }

      if (await this.sim.isFresh()) {
        this.launchAndQuitSimulator();
      }

      await setLoc();
    } else if (this.opts.udid) {
      logger.debug("Not setting locale because we're using a real device");
    } else {
      logger.debug("Not setting locale");
    }
  }

  async setPreferences () {
    if (!this.needToSetPrefs) {
      logger.debug("No iOS / app preferences to set");
      return;
    } else if (this.opts.fullReset) {
      let msg = "Cannot set preferences because a full-reset was requested";
      logger.debug(msg);
      logger.error(msg);
      throw new Error(msg);
    }

    logger.debug("Setting iOS and app preferences");
    // TODO why this is needed?: this.sim.dirsExist

    if (await this.sim.isFresh()) {
      await this.launchAndQuitSimulator();
    }

    try {
      await this.setLocServicesPrefs();
    } catch (e) {
      logger.error("Error setting location services preferences, prefs will not work");
      logger.error(e);
      logger.error(e.stack);
    }
    // TODO: safari prefs
    try {
      await this.setSafariPrefs();
    } catch (e) {
      logger.error("Error setting safari preferences, prefs will not work");
      logger.error(e);
      logger.error(e.stack);
    }
  }

  async setLocServicesPrefs () {
    let locServ = _.find([this.opts.locationServicesEnabled, this.opts.locationServicesAuthorized], (c) => {
      return !_.isUndefined(c);
    });
    if (!_.isUndefined(locServ)) {
      locServ = locServ ? 1 : 0;
      logger.debug("Setting location services to " + locServ);
      await this.sim.updateSettings('locationServices', {
           LocationServicesEnabled: locServ,
          'LocationServicesEnabledIn7.0': locServ,
          'LocationServicesEnabledIn8.0': locServ
         }
      );
    }
    if (!_.isUndefined(this.opts.locationServicesAuthorized)) {
      if (!this.opts.bundleId) {
        let msg = "Can't set location services for app without bundle ID";
        logger.error(msg);
        throw new Error(msg);
      }
      let locAuth = !!this.opts.locationServicesAuthorized;
      if (locAuth) {
        logger.debug("Authorizing location services for app");
      } else {
        logger.debug("De-authorizing location services for app");
      }
      await this.sim.updateLocationSettings(this.opts.bundleId, locAuth);
    }
  }

  async setSafariPrefs () {
    let safariSettings = {};

    if (_.has(this.opts, 'safariAllowPopups')) {
      let val = !!this.opts.safariAllowPopups;
      logger.debug(`Setting javascript window opening to '${val}'`);
      safariSettings.WebKitJavaScriptCanOpenWindowsAutomatically = val;
      safariSettings.JavaScriptCanOpenWindowsAutomatically = val;
    }
    if (_.has(this.opts, 'safariIgnoreFraudWarning')) {
      let val = !this.opts.safariIgnoreFraudWarning;
      logger.debug(`Setting fraudulent website warning to '${val}'`);
      safariSettings.WarnAboutFraudulentWebsites = val;
    }
    if (_.has(this.opts, 'safariOpenLinksInBackground')) {
      let val = this.opts.safariOpenLinksInBackground ? 1 : 0;
      logger.debug(`Setting opening links in background to '${!!val}'`);
      safariSettings.OpenLinksInBackground = val;
    }
    if (_.size(safariSettings) > 0) {
      await this.sim.updateSafariSettings(safariSettings);
    }
  }

  async startLogCapture () {
    if (!_.isEmpty(this.logs)) {
      throw new Error("Trying to start iOS log capture but it's already started!");
    }
    this.logs.crashlog = new IOSCrashLog();
    this.logs.syslog = new IOSLog({
      sim: this.sim,
      udid: this.opts.udid
    , showLogs: this.opts.showIOSLog
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
    if (this.opts.origAppPath) {
      logger.debug("Copying app back to its original place");
      return await fs.ncp(this.opts.app, this.opts.origAppPath);
    }
  }

  async setBundleId () {
    if (this.opts.bundleId) {
      // We already have a bundle Id
      return;
    } else {
      let bId = await this.uiAutoClient.sendCommand('au.bundleId()');
      logger.debug('Bundle ID for open app is ' + bId.value);
      this.opts.bundleId = bId.value;
    }
  }

  async setInitialOrientation () {
    if (typeof this.opts.initialOrientation === "string" &&
        _.contains(["LANDSCAPE", "PORTRAIT"],
                   this.opts.initialOrientation.toUpperCase())
        ) {
      logger.debug("Setting initial orientation to " + this.opts.initialOrientation);
      let command = ["au.setScreenOrientation('",
        this.opts.initialOrientation.toUpperCase(), "')"].join('');
      try {
        await this.uiAutoClient.sendCommand(command);
        this.opts.curOrientation = this.opts.initialOrientation;
      } catch (err) {
        logger.warn("Setting initial orientation failed with:", err);
      }
    }
  }

  isRealDevice () {
    return !!this.opts.udid;
  }

  isSafari () {
    return this.opts.safari;
  }

  async waitForAppLaunched  () {
    // on iOS8 in particular, we can get a working session before the app
    // is ready to respond to commands; in that case the source will be empty
    // so we just spin until it's not
    let condFn;
    if (this.opts.waitForAppScript) {
      // the default getSourceForElementForXML does not fit some use case, so making this customizable.
      // TODO: collect script from customer and propose several options, please comment in issue #4190.
      logger.debug("Using custom script to wait for app start:" + this.opts.waitForAppScript);
      condFn = async () => {
        let res;
        try {
          res = await this.uiAutoClient.sendCommand('try{\n' + this.opts.waitForAppScript +
                     '\n} catch(err) { $.log("waitForAppScript err: " + error); false; };');
        } catch(err) {
          logger.debug('Cannot eval waitForAppScript script, err:', err);
          return false;
        }
        if (typeof res !== 'boolean') {
          logger.debug('Unexpected return type in waitForAppScript script');
          return false;
        }
        return res;
      };
    } else if (this.isSafari()) {
      if (this.isRealDevice()) {
        await this.clickButtonToLaunchSafari();
      }
      logger.debug('Waiting for initial webview');
      await this.navToInitialWebview();
      condFn = async () => {
        return true;
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
    try {
      await waitForCondition(condFn, { waitMs: 10000, intervalMs: 500, logger: logger});
    } catch (err) {
      if (err.message && err.message.match(/Condition unmet/)) {
        logger.warn('Initial spin timed out, continuing but the app might not be ready.');
        logger.debug('Initial spin error was:', err);
      } else {
        throw err;
      }
    }
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
    this.instruments.onShutdown.catch(async () => {
      // unexpected exit
      await this.startUnexpectedShutdown(new errors.UnknownError('Abnornal Instruments termination!'));
    }).done();
  }

  shouldIgnoreInstrumentsExit () {
    return this.safari && this.isRealDevice();
  }

  async makeInstruments () {
    // at the moment all the logging in uiauto is at debug level
    let bootstrapPath = await prepareBootstrap({
      sock: this.sock,
      interKeyDelay: this.opts.interKeyDelay,
      justLoopInfinitely: false,
      autoAcceptAlerts: this.opts.autoAcceptAlerts,
      autoDismissAlerts: this.opts.autoDismissAlerts,
      sendKeyStrategy: this.opts.sendKeyStrategy || (this.opts.udid ? 'grouped' : 'oneByOne')
    });
    let instruments = new Instruments({
      // on real devices bundleId is always used
      app: (!this.opts.udid ? this.opts.app : null) || this.opts.bundleId,
      udid: this.opts.udid,
      processArguments: this.opts.processArguments,
      ignoreStartupExit: this.shouldIgnoreInstrumentsExit(),
      bootstrap: bootstrapPath,
      template: this.opts.automationTraceTemplatePath,
      instrumentsPath: this.opts.instrumentsPath,
      withoutDelay: this.opts.withoutDelay,
      platformVersion: this.opts.platformVersion,
      webSocket: this.opts.webSocket,
      launchTimeout: this.opts.launchTimeout,
      flakeyRetries: this.opts.backendRetries,
      simulatorSdkAndDevice: this.iosSdkVersion >= 7.1 ? await this.adjustedDeviceName() : null,
      tmpDir: path.resolve(this.opts.tmpDir || '/tmp' , 'appium-instruments'),
      traceDir: this.opts.traceDir
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
    if (this.opts.udid) {
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
      this.iosSdkVersion, this.opts);
    let dString = await this.adjustedDeviceName();
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

  async adjustedDeviceName () {
    return await getDeviceString(this.opts);
  }

}

for (let [cmd, fn] of _.pairs(commands)) {
  IosDriver.prototype[cmd] = fn;
}
export { IosDriver };
