import { BaseDriver, DeviceSettings, errors } from 'appium-base-driver';
import utils from './utils';
import logger from './logger';
import path from 'path';
import _ from 'lodash';
import B from 'bluebird';
import { fs } from 'appium-support';
import { getSimulator, installSSLCert, uninstallSSLCert } from 'appium-ios-simulator';
import { prepareBootstrap, UIAutoClient } from './uiauto/uiauto';
import { Instruments, instrumentsUtils } from './instruments';
import { retry, waitForCondition } from 'asyncbox';
import commands from './commands/index';
import { desiredCapConstraints, desiredCapValidation } from './desired-caps';
import _iDevice from 'node-idevice';
import { SAFARI_BUNDLE } from './commands/safari';
import { install, needsInstall, SAFARI_LAUNCHER_BUNDLE } from './safari-launcher';
import { setLocaleAndPreferences } from './settings';
import { runSimulatorReset, isolateSimulatorDevice, checkSimulatorAvailable,
         moveBuiltInApp, getAdjustedDeviceName, endSimulator, runRealDeviceReset } from './device';
import { IWDP } from './iwdp';


// promisify _iDevice
let iDevice = function (...args) {
  let device = _iDevice(...args);
  let promisified = {};
  for (let m of ['install', 'installAndWait', 'remove', 'isInstalled']) {
    promisified[m] = B.promisify(device[m].bind(device));
  }
  return promisified;
};

const defaultServerCaps = {
  webStorageEnabled: false,
  locationContextEnabled: false,
  browserName: '',
  platform: 'MAC',
  javascriptEnabled: true,
  databaseEnabled: false,
  takesScreenshot: true,
  networkConnectionEnabled: false,
};

const LOG_LOCATIONS = [
  path.resolve('/', 'Library', 'Caches', 'com.apple.dt.instruments'),
];
if (process.env.HOME) {
  LOG_LOCATIONS.push(path.resolve(process.env.HOME, 'Library', 'Logs', 'CoreSimulator'));
}

class IosDriver extends BaseDriver {
  resetIos () {
    this.appExt = ".app";
    this.xcodeVersion = null;
    this.iosSdkVersion = null;
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
    this.landscapeWebCoordsOffset = 0;
    this.keepAppToRetainPrefs = false;
    this.ready = false;
    this.asyncWaitMs = 0;

    this.settings = new DeviceSettings({}, _.noop);

    this.locatorStrategies = [
      'xpath',
      'id',
      'class name',
      '-ios uiautomation',
      'accessibility id'
    ];
    this.webLocatorStrategies = [
      'link text',
      'css selector',
      'tag name',
      'partial link text'
    ];
  }

  constructor (opts, shouldValidateCaps) {
    super(opts, shouldValidateCaps);

    this.desiredCapConstraints = desiredCapConstraints;
    this.resetIos();
    this.getDevicePixelRatio = _.memoize(this.getDevicePixelRatio);
  }

  validateLocatorStrategy (strategy) {
    super.validateLocatorStrategy(strategy, this.isWebContext());
  }

  async start () {
    if (this.isRealDevice()) {
      await this.startRealDevice();
    } else {
      await this.startSimulator();
    }
    this.ready = true;
  }

  async createSession (...args) {
    let [sessionId, caps] = await super.createSession(...args);

    // appium-ios-driver uses Instruments to automate the device
    // but Xcode 8 does not have Instruments, so short circuit
    this.xcodeVersion = await utils.getAndCheckXcodeVersion(this.opts);
    logger.debug(`Xcode version set to ${this.xcodeVersion.versionString}`);
    if (this.xcodeVersion.major >= 8) {
      let msg = `Appium's IosDriver does not support Xcode version ${this.xcodeVersion.versionString}. ` +
                'Apple has deprecated UIAutomation. Use the "XCUITest" automationName capability instead.';
      logger.errorAndThrow(new errors.SessionNotCreatedError(msg));
    }

    // merge server capabilities + desired capabilities
    this.caps = Object.assign({}, defaultServerCaps, this.caps);
    this.caps.desired = caps;

    await utils.detectUdid(this.opts);
    await utils.prepareIosOpts(this.opts);
    this.realDevice = null;
    this.useRobot = this.opts.useRobot;
    this.safari = this.opts.safari;
    this.opts.curOrientation = this.opts.initialOrientation;

    this.sock = path.resolve(this.opts.tmpDir || '/tmp', 'instruments_sock');

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
    return [sessionId, this.caps];
  }

  async stop () {
    this.ready = false;

    if (this.uiAutoClient) {
      await this.uiAutoClient.shutdown();
    }

    if (this.instruments) {
      try {
        await this.instruments.shutdown();
      } catch (err) {
        logger.error(`Instruments didn't shut down. ${err}`);
      }
    }

    if (this.caps && this.caps.customSSLCert && !this.isRealDevice()) {
      logger.debug(`Uninstalling ssl certificate for udid '${this.sim.udid}'`);
      await uninstallSSLCert(this.caps.customSSLCert, this.sim.udid);
    }

    if (this.opts.enableAsyncExecuteFromHttps && !this.isRealDevice()) {
      await this.stopHttpsAsyncServer();
    }

    this.uiAutoClient = null;
    this.instruments = null;
    this.realDevice = null;

    // postcleanup
    this.curCoords = null;
    this.opts.curOrientation = null;
    if (!_.isEmpty(this.logs)) {
      await this.logs.syslog.stopCapture();
      this.logs = {};
    }

    if (this.remote) {
      await this.stopRemote();
    }

    await this.stopIWDP();
  }

  async deleteSession () {
    logger.debug("Deleting ios session");

    await this.stop();

    if (this.opts.clearSystemFiles) {
      await utils.clearLogs(LOG_LOCATIONS);
    } else {
      logger.debug('Not clearing log files. Use `clearSystemFiles` capability to turn on.');
    }

    if (this.isRealDevice()) {
      await runRealDeviceReset(this.realDevice, this.opts);
    } else {
      await runSimulatorReset(this.sim, this.opts, this.keepAppToRetainPrefs);
    }
    await super.deleteSession();
  }

  async getSession () {
    let caps = await super.getSession();

    const viewportRect = await this.getViewportRect();
    const pixelRatio = await this.getDevicePixelRatio();
    const statBarHeight = await this.getStatusBarHeight();

    caps.viewportRect = viewportRect;
    caps.pixelRatio = pixelRatio;
    caps.statBarHeight = statBarHeight;

    return caps;
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
      } else if (this.opts.app && this.opts.app.toLowerCase() === "calendar") {
        if (parseFloat(this.opts.platformVersion) >= 8) {
          logger.debug("We are on iOS8+ so not copying calendar app");
          this.opts.bundleId = "com.apple.mobilecal";
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
          // first check if it is already on the device
          if (!await this.realDevice.isInstalled(this.opts.bundleId)) {
            // it's not on the device, so check if we need to build
            if (await needsInstall()) {
              logger.debug('SafariLauncher not found, building...');
              await install();
            }
            this.opts.bundleId = SAFARI_LAUNCHER_BUNDLE;
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

    if (!this.xcodeVersion) {
      logger.debug("Setting Xcode version");
      this.xcodeVersion = await utils.getAndCheckXcodeVersion(this.opts);
      logger.debug(`Xcode version set to ${this.xcodeVersion.versionString}`);
    }

    logger.debug("Setting iOS SDK Version");
    this.iosSdkVersion = await utils.getAndCheckIosSdkVersion();
    logger.debug(`iOS SDK Version set to ${this.iosSdkVersion}`);

    let timeout = _.isObject(this.opts.launchTimeout) ? this.opts.launchTimeout.global : this.opts.launchTimeout;
    let availableDevices = await retry(3, instrumentsUtils.getAvailableDevices, timeout);

    let iosSimUdid = await checkSimulatorAvailable(this.opts, this.iosSdkVersion, availableDevices);

    this.sim = await getSimulator(iosSimUdid, this.xcodeVersion.versionString);

    await moveBuiltInApp(this.sim);

    await utils.parseLocalizableStrings(this.opts);

    await utils.setBundleIdFromApp(this.opts);

    await this.createInstruments();

    {
      // previously setDeviceInfo()
      this.shouldPrelaunchSimulator = utils.shouldPrelaunchSimulator(this.opts, this.iosSdkVersion);
      let dString = await getAdjustedDeviceName(this.opts);
      if (this.caps.app) {
        await utils.setDeviceTypeInInfoPlist(this.opts.app, dString);
      }
    }

    await runSimulatorReset(this.sim, this.opts, this.keepAppToRetainPrefs);

    if (this.caps.customSSLCert && !this.isRealDevice()) {
      await installSSLCert(this.caps.customSSLCert, this.sim.udid);
    }

    if (this.opts.enableAsyncExecuteFromHttps && !this.isRealDevice()) {
      // await this.sim.shutdown();
      await this.startHttpsAsyncServer();
    }

    await isolateSimulatorDevice(this.sim, this.opts);
    this.localConfig = await setLocaleAndPreferences(this.sim, this.opts, this.isSafari(), endSimulator);
    await this.startLogCapture(this.sim);
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
    await utils.parseLocalizableStrings(this.opts);
    await utils.setBundleIdFromApp(this.opts);
    await this.createInstruments();
    await runRealDeviceReset(this.realDevice, this.opts);
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
    // if user has passed in desiredCaps.autoLaunch = false
    // meaning they will manage app install / launching
    if (this.opts.autoLaunch === false) {
      return;
    }

    // if we have an ipa file, set it in opts
    if (this.opts.app) {
      let ext = this.opts.app.substring(this.opts.app.length - 3).toLowerCase();
      if (ext === 'ipa') {
        this.opts.ipa = this.opts.app;
      }
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
        logger.debug("App is not installed. Will try to install.");
      }

      if (this.opts.ipa && this.opts.bundleId) {
        await this.installIpa();
        logger.debug('App installed.');
      } else if (this.opts.ipa) {
        let msg = "You specified a UDID and ipa but did not include the bundle id";
        logger.warn(msg);
        throw new errors.UnknownError(msg);
      } else if (this.opts.app) {
        await this.realDevice.install(this.opts.app);
        logger.debug('App installed.');
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
    logger.debug(`Creating iDevice object with udid ${this.opts.udid}`);
    try {
      return iDevice(this.opts.udid);
    } catch (e1) {
      logger.debug(`Couldn't find ideviceinstaller, trying built-in at ${idiPath}`);
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
    logger.debug(`Installing ipa found at ${this.opts.ipa}`);
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
    if (!res) return res; // eslint-disable-line curly

    return desiredCapValidation(caps);
  }

  async prelaunchSimulator () {
    if (!this.shouldPrelaunchSimulator) {
      logger.debug("Not pre-launching simulator");
      return;
    }
    await endSimulator(this.sim);
    // TODO: implement prelaunch sim in simulator package
  }

  async onInstrumentsLaunch () {
    logger.debug('Instruments launched. Starting poll loop for new commands.');
    if (this.opts.origAppPath) {
      logger.debug("Copying app back to its original place");
      return await fs.copyFile(this.opts.app, this.opts.origAppPath);
    }
  }

  async setBundleId () {
    if (this.opts.bundleId) {
      // We already have a bundle Id
      return;
    } else {
      let bId = await this.uiAutoClient.sendCommand('au.bundleId()');
      logger.debug(`Bundle ID for open app is ${bId.value}`);
      this.opts.bundleId = bId.value;
    }
  }

  async startIWDP () {
    if (this.opts.startIWDP) {
      this.iwdpServer = new IWDP(this.opts.webkitDebugProxyPort, this.opts.udid);
      await this.iwdpServer.start();
    }
  }

  async stopIWDP () {
    if (this.iwdpServer) {
      await this.iwdpServer.stop();
      delete this.iwdpServer;
    }
  }

  async setInitialOrientation () {
    if (typeof this.opts.initialOrientation === "string" &&
        _.includes(["LANDSCAPE", "PORTRAIT"],
                   this.opts.initialOrientation.toUpperCase())
        ) {
      logger.debug(`Setting initial orientation to ${this.opts.initialOrientation}`);
      let command = `au.setScreenOrientation('${this.opts.initialOrientation.toUpperCase()}')`;
      try {
        await this.uiAutoClient.sendCommand(command);
        this.opts.curOrientation = this.opts.initialOrientation;
      } catch (err) {
        logger.warn(`Setting initial orientation failed with: ${err}`);
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
      logger.debug(`Using custom script to wait for app start: ${this.opts.waitForAppScript}`);
      condFn = async () => {
        let res;
        try {
          res = await this.uiAutoClient.sendCommand(`try{\n${this.opts.waitForAppScript}` +
                     `\n} catch(err) { $.log("waitForAppScript err: " + error); false; };`);
        } catch (err) {
          logger.debug(`Cannot eval waitForAppScript script, err: ${err}`);
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
      await waitForCondition(condFn, {logger, waitMs: 10000, intervalMs: 500});
    } catch (err) {
      if (err.message && err.message.match(/Condition unmet/)) {
        logger.warn('Initial spin timed out, continuing but the app might not be ready.');
        logger.debug(`Initial spin error was: ${err}`);
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
    this.instruments.onShutdown.catch(async () => { // eslint-disable-line promise/catch-or-return
      // unexpected exit
      await this.startUnexpectedShutdown(new errors.UnknownError('Abnormal Instruments termination!'));
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
      sendKeyStrategy: this.opts.sendKeyStrategy || (this.isRealDevice() ? 'grouped' : 'oneByOne')
    });
    let instruments = new Instruments({
      // on real devices bundleId is always used
      app: (!this.isRealDevice() ? this.opts.app : null) || this.opts.bundleId,
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
      realDevice: this.isRealDevice(),
      simulatorSdkAndDevice: this.iosSdkVersion >= 7.1 ? await getAdjustedDeviceName(this.opts) : null,
      tmpDir: path.resolve(this.opts.tmpDir || '/tmp', 'appium-instruments'),
      traceDir: this.opts.traceDir,
      locale: this.opts.locale,
      language: this.opts.language
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
    let cmd = 'target = $.target();\n';
    cmd += 'au = $;\n';
    cmd += `$.isVerbose = ${isVerbose};\n`;
    // Not using uiauto grace period because of bug.
    // cmd += '$.target().setTimeout(1);\n';
    await this.uiAutoClient.sendCommand(cmd);
  }

  async getSourceForElementForXML (ctx) {
    let source;
    if (!ctx) {
      source = await this.uiAutoClient.sendCommand("au.mainApp().getTreeForXML()");
    } else {
      source = await this.uiAutoClient.sendCommand(`au.getElement('${ctx}').getTreeForXML()`);
    }
    // TODO: all this json/xml logic is very expensive, we need
    // to use a SAX parser instead.
    if (source) {
      return JSON.stringify(source);
    } else {
      // this should never happen but we've received bug reports; this will help us track down
      // what's wrong in getTreeForXML
      throw new Error(`Bad response from getTreeForXML. res was ${JSON.stringify(source)}`);
    }
  }

  get realDevice () {
    this._realDevice = this._realDevice || this.getIDeviceObj();
    return this._realDevice;
  }

  set realDevice (rd) {
    this._realDevice = rd;
  }
}

for (let [cmd, fn] of _.toPairs(commands)) {
  IosDriver.prototype[cmd] = fn;
}


export { IosDriver, defaultServerCaps };
export default IosDriver;
