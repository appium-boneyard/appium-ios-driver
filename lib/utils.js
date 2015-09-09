import { rimraf, fs, plist } from 'appium-support';
import  xcode from 'appium-xcode';
import logger from './logger';
import path from 'path';
import _ from 'lodash';
import _which from 'which';
import B from 'bluebird';
import { exec } from 'teen_process';
import { waitForCondition } from 'asyncbox';


const which = B.promisify(_which);
const rootDir = path.resolve(__dirname, '..', '..');
const SAFARI_BUNDLE = 'com.apple.mobilesafari';

function prepareIosOpts (opts) {
  opts.withoutDelay = opts.nativeInstrumentsLib;
  opts.reset = !opts.noReset;
  opts.initialOrientation = opts.deviceOrientation ||
                            opts.orientation ||
                            "PORTRAIT";
  opts.useRobot = opts.robotPort > 0;
  opts.robotUrl = opts.useRobot ?
    `http://${opts.robotAddress}:${opts.robotPort}` : null;
  if (opts.locationServicesAuthorized && !opts.bundleId) {
    throw new Error("You must set the bundleId cap if using locationServicesEnabled");
  }

  let pv = parseFloat(opts.platformVersion);
  if (pv < 7.1) {
    logger.warn(`iOS version ${opts.platformVersion} support has been ` +
                `deprecated and will be removed in a future version of ` +
                `Appium.`);
  }
  opts.localizableStringsDir = opts.localizableStringsDir || 'en.lproj';
  opts.autoAcceptAlerts = _.isNull(opts.autoAcceptAlerts) || _.isUndefined(opts.autoAcceptAlerts) ? false : opts.autoAcceptAlerts;
  opts.autoDismissAlerts = _.isNull(opts.autoDismissAlerts) || _.isUndefined(opts.autoDismissAlerts) ? false : opts.autoDismissAlerts;

  if (opts.browserName.toLowerCase() === 'safari' ||
      opts.app.toLowerCase() === 'safari' ||
      (opts.bundleId || '').toLowerCase() === SAFARI_BUNDLE) {
    // preparing a safari session
    opts.safari = true;
  }
}

function appIsPackageOrBundle (app) {
  return (/^([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)+$/).test(app);
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

async function getAndCheckIosSdkVersion () {
  let versionNumber;
  try {
    versionNumber = await xcode.getMaxIOSSDK();
  } catch (err) {
    logger.error("Could not determine iOS SDK version");
    throw err;
  }
  return versionNumber;
}

function getDeviceString (xcodeVersion, iosSdkVersion, caps) {
  logger.debug("Getting device string from caps: " + JSON.stringify({
    forceIphone: caps.forceIphone,
    forceIpad: caps.forceIpad,
    xcodeVersion: xcodeVersion,
    iosSdkVersion: iosSdkVersion,
    deviceName: caps.deviceName,
    platformVersion: caps.platformVersion
  }));
  let isiPhone = caps.forceIphone || caps.forceIpad === null || (caps.forceIpad !== null && !caps.forceIpad);
  let isTall = isiPhone;
  let isRetina = xcodeVersion[0] !== '4';
  let is64bit = false;
  let deviceName = caps.deviceName;
  let fixDevice = true;
  if (deviceName && deviceName[0] === '=') {
    return deviceName.substring(1);
  }
  logger.debug("fixDevice is " + (fixDevice ? "on" : "off"));
  if (deviceName) {
    let device = deviceName.toLowerCase();
    if (device.indexOf("iphone") !== -1) {
      isiPhone = true;
    } else if (device.indexOf("ipad") !== -1) {
      isiPhone = false;
    }
    if (deviceName !== caps.platformName) {
      isTall = isiPhone && (device.indexOf("4-inch") !== -1);
      isRetina =  (device.indexOf("retina") !== -1);
      is64bit = (device.indexOf("64-bit") !== -1);
    }
  }

  let iosDeviceString = isiPhone ? "iPhone" : "iPad";
  if (xcodeVersion[0] === '4') {
    if (isiPhone && isRetina) {
      iosDeviceString += isTall ? " (Retina 4-inch)" : " (Retina 3.5-inch)";
    } else {
      iosDeviceString += isRetina ? " (Retina)" : "";
    }
  } else if (xcodeVersion[0] === '5') {
    iosDeviceString += isRetina ? " Retina" : "";
    if (isiPhone) {
      if (isRetina && isTall) {
        iosDeviceString += is64bit ? " (4-inch 64-bit)" : " (4-inch)";
      } else if (deviceName.toLowerCase().indexOf("3.5") !== -1) {
        iosDeviceString += " (3.5-inch)";
      }
    } else {
      iosDeviceString += is64bit ? " (64-bit)" : "";
    }
  } else if (xcodeVersion[0] === '6') {
    iosDeviceString = caps.deviceName ||
      (isiPhone ? "iPhone Simulator" : "iPad Simulator");
  }
  let reqVersion = caps.platformVersion || iosSdkVersion;
  if (iosSdkVersion >= 8) {
    iosDeviceString += " (" + reqVersion + " Simulator)";
  } else if (iosSdkVersion >= 7.1) {
    iosDeviceString += " - Simulator - iOS " + reqVersion;
  }
  if (fixDevice) {
    // Some device config are broken in 5.1
    let CONFIG_FIX = {
      'iPhone - Simulator - iOS 7.1': 'iPhone Retina (4-inch 64-bit) - ' +
                                      'Simulator - iOS 7.1',
      'iPad - Simulator - iOS 7.1': 'iPad Retina (64-bit) - Simulator - ' +
                                    'iOS 7.1',
      'iPad Simulator (8.0 Simulator)': 'iPad 2 (8.0 Simulator)',
      'iPad Simulator (8.1 Simulator)': 'iPad 2 (8.1 Simulator)',
      'iPad Simulator (8.2 Simulator)': 'iPad 2 (8.2 Simulator)',
      'iPad Simulator (8.3 Simulator)': 'iPad 2 (8.3 Simulator)',
      'iPad Simulator (8.4 Simulator)': 'iPad 2 (8.4 Simulator)',
      'iPad Simulator (7.1 Simulator)': 'iPad 2 (7.1 Simulator)',
      'iPhone Simulator (8.4 Simulator)': 'iPhone 6 (8.4 Simulator)',
      'iPhone Simulator (8.3 Simulator)': 'iPhone 6 (8.3 Simulator)',
      'iPhone Simulator (8.2 Simulator)': 'iPhone 6 (8.2 Simulator)',
      'iPhone Simulator (8.1 Simulator)': 'iPhone 6 (8.1 Simulator)',
      'iPhone Simulator (8.0 Simulator)': 'iPhone 6 (8.0 Simulator)',
      'iPhone Simulator (7.1 Simulator)': 'iPhone 5s (7.1 Simulator)'
    };
    if (CONFIG_FIX[iosDeviceString]) {
      let oldDeviceString = iosDeviceString;
      iosDeviceString = CONFIG_FIX[iosDeviceString];
      logger.debug("Fixing device. Changed from: \"" + oldDeviceString +
                   "\" to: \"" + iosDeviceString + "\"");
    }
  }
  logger.debug("Final device string is: '" + iosDeviceString + "'");
  return iosDeviceString;
}

function getSimForDeviceString (dString, availDevices) {
  let matchedDevice = null;
  let matchedUdid = null;
  _.each(availDevices, function (device) {
    if (device.indexOf(dString) !== -1) {
      matchedDevice = device;
      try {
        matchedUdid = /.+\[([^\]]+)\]/.exec(device)[1];
      } catch (e) {
        matchedUdid = null;
      }
    }
  });
  return [matchedDevice, matchedUdid];
}

async function detectUdid (caps) {
  if (caps.udid !== null && caps.udid === "auto") {
    logger.debug("Auto-detecting iOS udid...");
    let  cmd, args = [];
    try {
      cmd = await which('idevice_id');
      args.push('-l');
    } catch (err) {
      cmd = require.resolve('udidetect');
    }
    let udid;
    try {
      let {stdout} = await exec(cmd, args, {timeout: 3000});
      udid = stdout.split("\n")[0];
    } catch (err) {
      logger.error("Error detecting udid");
      throw err;
    }
    if (udid && udid.length > 2) {
      caps.udid = udid;
      logger.debug("Detected udid as " + caps.udid);
    } else {
      throw new Error("Could not detect udid.");
    }
  } else {
    logger.debug("Not auto-detecting udid.");
  }
}

async function parseLocalizableStrings (opts) {
  if (_.isNull(opts.app) || _.isUndefined(opts.app)) {
    logger.debug("Localizable.strings is not currently supported when using real devices.");
    return;
  }
  let language = opts.language;
  let stringFile = "Localizable.strings";
  let strings = null;

  if (language) {
    strings = path.resolve(opts.app, language + ".lproj", stringFile);
  }
  if (!await fs.exists(strings)) {
    if (language) {
      logger.debug("No strings file '" + stringFile + "' for language '" + language + "', getting default strings");
    }
    strings = path.resolve(opts.app, stringFile);
  }
  if (!await fs.exists(strings)) {
    strings = path.resolve(opts.app, opts.localizableStringsDir, stringFile);
  }
  if (!await fs.exists(strings)) {
    logger.warn('Could not file localizable strings file: Localizable.strings!');
    return;
  }

  let obj;
  try {
    obj = await plist.parsePlistFile(strings);
    logger.debug("Parsed app " + stringFile);
    opts.localizableStrings = obj;
  } catch (err) {
    logger.warn("Could not parse app " + stringFile +" assuming it " +
                "doesn't exist");
  }
}

async function getBundleIdFromApp (app) {
  logger.debug("Getting bundle ID from app");
  let plistFile = path.resolve(app, "Info.plist");
  let obj;
  try {
    obj = await plist.parsePlistFile(plistFile);
  } catch (err) {
    logger.error("Could not get the bundleId from app.");
    throw err;
  }
  return obj.CFBundleIdentifier;
}

async function setBundleIdFromApp (caps) {
  // This method will try to extract the bundleId from the app
  if (!caps.bundleId) {
    try {
      caps.bundleId = await getBundleIdFromApp(caps.app);
    } catch (err) {
      logger.error("Could not set the bundleId from app.");
      throw err;
    }
  }
}

function shouldPrelaunchSimulator (caps, iosSdkVersion) {
  let shouldPrelaunch = false;

  if (caps.defaultDevice || iosSdkVersion >= 7.1) {
    if (this.iosSdkVersion >= 7.1) {
      logger.debug("We're on iOS7.1+ so forcing defaultDevice on");
    } else {
      logger.debug("User specified default device, letting instruments launch it");
    }
  } else {
    shouldPrelaunch = true;
  }
  return shouldPrelaunch;
}

async function setDeviceTypeInInfoPlist (app, deviceString) {
  if (_.isNull(app) || _.isUndefined(app)) { return; }
  let plistFile = path.resolve(app, "Info.plist");
  let isiPhone = deviceString.toLowerCase().indexOf("ipad") === -1;
  let deviceTypeCode = isiPhone ? 1 : 2;
  await plist.updatePlistFile(plistFile, {UIDeviceFamily: [deviceTypeCode]});
}

async function endSimulatorDaemons () {
  // TODO: Should it be moved to appium-ios-simulator?
  for (let servicePattern of ['com.apple.iphonesimulator', 'com.apple.CoreSimulator']) {
    logger.debug(`Killing any other ${servicePattern} daemons`);
    try {
      let stopCmd = `launchctl list | grep ${servicePattern} | cut -f 3 | xargs -n 1 launchctl stop`;
      await exec('bash', ['-c', stopCmd]);
    } catch (err) {
      logger.warn(`Could not stop ${servicePattern} daemons, carrying on anyway!`);
    }
    try {
      let removeCmd = `launchctl list | grep ${servicePattern} | cut -f 3 | xargs -n 1 launchctl remove`;
      await exec('bash', ['-c', removeCmd]);
    } catch (err) {
      logger.warn(`Could not remove ${servicePattern} daemons, carrying on anyway!`);
    }
  }
  // waiting until the simulator service has died.
  try {
    await waitForCondition(async () => {
      let {stdout} = await exec('bash', ['-c',
        `ps -e  | grep launchd_sim | grep -v bash | grep -v grep | awk {'print$1'}`]);
      return stdout.trim().length === 0;
    }, {waitMs: 5000, intervalMs: 500});
  } catch (err) {
    logger.warn(`Could not end all simulator daemons, carrying on!`);
  }
}

function unwrapEl (el) {
  if(typeof el === 'object' && el.ELEMENT){
    return el.ELEMENT;
  }
  return el;
}

export default { rootDir, removeInstrumentsSocket, getAndCheckXcodeVersion, prepareIosOpts,
  appIsPackageOrBundle, getAndCheckIosSdkVersion,  detectUdid, parseLocalizableStrings,
  setBundleIdFromApp, shouldPrelaunchSimulator, setDeviceTypeInInfoPlist, getDeviceString,
  endSimulatorDaemons, getSimForDeviceString, unwrapEl };

