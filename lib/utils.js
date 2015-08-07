import { rimraf } from 'appium-support';
import  xcode from 'appium-xcode';
import logger from './logger';
import path from 'path';

let rootDir = path.resolve(__dirname, '..', '..');

function prepareIosCaps (caps) {
  caps.withoutDelay = caps.nativeInstrumentsLib;
  caps.reset = !caps.noReset;
  caps.initialOrientation = caps.deviceOrientation ||
                            caps.orientation ||
                            "PORTRAIT";
  caps.useRobot = caps.robotPort > 0;
  caps.robotUrl = caps.useRobot ?
    "http://" + caps.robotAddress + ":" + caps.robotPort + "" :
    null;
  if (caps.locationServicesAuthorized && !caps.bundleId) {
    throw new Error("You must set the bundleId cap if using locationServicesEnabled");
  }

  if (parseFloat(caps.platformVersion) < 7.1) {
    logger.warn('iOS version', caps.platformVersion,
                                'iOS ' + caps.platformVersion + ' support has ' +
                                'been deprecated and will be removed in a ' +
                                'future version of Appium.');
  }
  return caps;
}

function appIsPackageOrBundle (app) {
  return (/^([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)+$/).test(app);
}

function prepareIosAppCaps (caps) {
  // on iOS8 we can use a bundleId to launch an app on the simulator, but
  // on previous versions we can only do so on a real device, so we need
  // to do a check of which situation we're in
  let ios8 = caps.platformVersion &&
             parseFloat(caps.platformVersion) >= 8;

  if (!caps.app &&
      !((ios8 || caps.udid) && caps.bundleId)) {
    throw new Error("Please provide the 'app' or 'browserName' capability or start " +
          "appium with the --app or --browser-name argument. Alternatively, " +
          "you may provide the 'bundleId' and 'udid' capabilities for an app " +
          "under test on a real device.");
  }

  // if the app name is a bundleId assign it to the bundleId property
  if (!caps.bundleId && appIsPackageOrBundle(caps.app)) {
    caps.bundleId = caps.app;
  }

  if (caps.app && caps.app.toLowerCase() === "settings") {
    if (parseFloat(caps.platformVersion) >= 8) {
      logger.debug("We're on iOS8+ so not copying preferences app");
      caps.bundleId = "com.apple.Preferences";
      caps.app = null;
    }
  } else if (caps.bundleId &&
             appIsPackageOrBundle(caps.bundleId) &&
             (!caps.app || appIsPackageOrBundle(caps.app))) {
    // we have a bundle ID, but no app, or app is also a bundle
    logger.debug("App is an iOS bundle, will attempt to run as pre-existing");
  }
  return caps;
}


async function removeInstrumentsSocket (sock) {
  logger.debug("Removing any remaining instruments sockets");
  await rimraf(sock);
  logger.debug("Cleaned up instruments socket " + sock);
}

async function getAndCheckXcodeVersion (caps) {
  let versionNumber;
  try {
    versionNumber = await xcode.getVersion();
  } catch (err) {
    logger.error("Could not determine Xcode version.");
    throw err;
  }
  let minorVersion = parseFloat(versionNumber.slice(0, 3));
  let pv = parseFloat(caps.platformVersion);
  // we deprecate Xcodes < 6.3, except for iOS 8.0 in which case we
  // support Xcode 6.0 as well
  if (minorVersion < 6.3 && (!(minorVersion === 6.0 && pv === 8.0))) {
    logger.warn( 'Xcode version', versionNumber,
                 'Support for Xcode ' + versionNumber + ' ' +
                 'has been deprecated and will be removed ' +
                 'in a future version. Please upgrade ' +
                 'to version 6.3 or higher (or version ' +
                 '6.0.1 for iOS 8.0)');
  }
  return versionNumber;
}

export default { rootDir, removeInstrumentsSocket, getAndCheckXcodeVersion, prepareIosCaps,
  appIsPackageOrBundle, prepareIosAppCaps };
