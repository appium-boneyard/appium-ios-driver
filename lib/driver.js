import { BaseDriver, configureApp } from 'appium-base-driver';
import utils from './utils';
import logger from './logger';
import path from 'path';

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
    this.iOSSDKVersion = null;
    this.iosSimProcess = null;
    this.iOSSimUdid = null;
    this.logs = {};
    this.instruments = null;
    this.commandProxy = null;
    // this.initQueue(); TODO: check integration with base driver
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
    this.localizableStrings = {};
    this.keepAppToRetainPrefs = false;
    this.isShuttingDown = false;
 }

  constructor(opts, shouldValidateCaps) {
    super(opts, shouldValidateCaps);
    this.resetIos();
 }

  async createSession (caps) {
    let [sessionId] = await super.createSession(caps);

    caps = utils.prepareIosCaps(caps);
    this.useRobot = caps.useRobot;
    this.curOrientation = caps.initialOrientation;
    this.sock = path.resolve(caps.tmpDir || '/tmp', 'instruments_sock');
    this.perfLogEnabled = !!(typeof caps.loggingPrefs === 'object' && caps.loggingPrefs.performance);

    caps = utils.prepareIosAppCaps(caps);
    try {
      await configureApp(caps.app, '.app');
    } catch (err) {
        logger.error("Bad app: " + caps.app + ". App paths need to " +
                     "be absolute, or relative to the appium server " +
                     "install dir, or a URL to compressed file, or a " +
                     "special app name.");
        throw err;
     }
    await this.startSession(caps);
    return [sessionId, caps];
  }

  async startSession (caps) {
    // TODO: sim or real device
    await this.startSimulator(caps);
  }

  async startSimulator (caps) {
    await utils.removeInstrumentsSocket(this.sock);

    logger.debug("Setting Xcode version");
    this.xcodeVersion = await utils.getAndCheckXcodeVersion(caps);
    logger.debug("Xcode version set to " + this.xcodeVersion);

    logger.debug("Setting iOS SDK Version");
    this.iOSSDKVersion = await utils.getAndCheckIosSdkVersion();
    logger.debug("iOS SDK Version set to " + this.iOSSDKVersion);

    //await this.checkSimAvailable();
    //await this.createSimulator();
    //await this._moveBuiltInApp();
    //await this.detectUdid();
    //await this._parseLocalizableStrings();
    //await this.setBundleIdFromApp();
    //await this.createInstruments();
    //await this.setDeviceInfo();
    //await this.checkPreferences();
    //await this.runSimReset();
    //await this.isolateSimDevice();
    //await this.setLocale();
    //await this.setPreferences.bind();
    //await this.startLogCapture();
    //await this.prelaunchSimulator();
    //await B.fromNode(this.startInstruments.bind(this));
    //await this.onInstrumentsLaunch();
    //await this.configureBootstrap();
    //await this._setBundleId();
    //await this._setInitialOrientation();
    //await this._initAutoWebview();
    //await this.waitForAppLaunched();
  }
}

export {IosDriver};
