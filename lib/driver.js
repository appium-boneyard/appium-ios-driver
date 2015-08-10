import { BaseDriver, configureApp } from 'appium-base-driver';
import utils from './utils';
import logger from './logger';
import path from 'path';
import _ from 'lodash';

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

    utils.prepareIosCaps(caps);
    this.useRobot = caps.useRobot;
    this.curOrientation = caps.initialOrientation;
    this.sock = path.resolve(caps.tmpDir || '/tmp', 'instruments_sock');
    this.perfLogEnabled = !!(typeof caps.loggingPrefs === 'object' && caps.loggingPrefs.performance);

    utils.prepareIosAppCaps(caps);
    try {
      caps.app = await configureApp(caps.app, '.app');
    } catch (err) {
        logger.error("Bad app: " + caps.app + ". App paths need to " +
                     "be absolute, or relative to the appium server " +
                     "install dir, or a URL to compressed file, or a " +
                     "special app name.");
        throw err;
     }
    await this.startSession();
    return [sessionId, caps];
  }

 async startSession () {
    // TODO: sim or real device
    await this.startSimulator();
  }

  async startSimulator () {
    await utils.removeInstrumentsSocket(this.sock);

    logger.debug("Setting Xcode version");
    this.xcodeVersion = await utils.getAndCheckXcodeVersion(this.caps);
    logger.debug("Xcode version set to " + this.xcodeVersion);

    logger.debug("Setting iOS SDK Version");
    this.iOSSDKVersion = await utils.getAndCheckIosSdkVersion();
    logger.debug("iOS SDK Version set to " + this.iOSSDKVersion);

    await utils.checkSimAvailable(this.xcodeVersion , this.iOSSDKVersion, this.caps);

    // TODO: check with Jonah
    //this.sim = new Simulator({
      //platformVer: this.caps.platformVersion,
      //sdkVer: this.iOSSDKVersion,
      //udid: this.iOSSimUdid
    //});

    // todo: check with isaac, jonah
    //await this.moveBuiltInApp();

    await utils.detectUdid(this.caps);
    await utils.parseLocalizableStrings(this.caps);

    await utils.setBundleIdFromApp(this.caps);

    // TODO await this.createInstruments();

    {
      // setDeviceInfo()
      this.shouldPrelaunchSimulator = utils.shouldPrelaunchSimulator(this.caps, this.iOSSDKVersion);
      let dString = utils.getDeviceString(this.xcodeVersion, this.iosSdkVersion, this.caps);
      await utils.setDeviceTypeInInfoPlist(this.caps.app, dString);
    }

    await this.checkPreferences();

    await this.runSimReset();
    await this.isolateSimDevice();
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
    // TODO: ping @Jonah await this.sim.deleteSim.bind(this.sim);
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
        // TODO: this.sim.cleanSim.bind(this.sim, this.caps.keepKeyChains, this.caps.tmpDir);
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
      // TODO (in instruments utils) Instruments.killAllSim();
    }
    await utils.endSimulatorDaemons();
  }

  async isolateSimDevice () {
    if (!this.caps.udid && this.cpas.isolateSimDevice &&
        this.iOSSDKVersion >= 8) {
      // TODO await this.sim.deleteOtherSims.bind(this.sim);
    }
  }

}

export {IosDriver};
