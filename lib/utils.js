import { fs, plist } from 'appium-support';
import xcode from 'appium-xcode';
import { extractBundleId } from './app-utils';
import logger from './logger';
import path from 'path';
import _ from 'lodash';
import { exec } from 'teen_process';
import { SAFARI_BUNDLE } from './commands/safari';
import { SAFARI_LAUNCHER_APP_FILE, SAFARI_LAUNCHER_BUNDLE } from './safari-launcher';


const rootDir = path.resolve(__dirname, '..', '..');
const STRINGSDICT_RESOURCE = '.stringsdict';
const STRINGS_RESOURCE =  '.strings';

async function prepareIosOpts (opts) {
  opts.backendRetries = 4;
  opts.withoutDelay = !opts.nativeInstrumentsLib;
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

  opts.platformVersion = opts.platformVersion || await xcode.getMaxIOSSDK();
  let pv = parseFloat(opts.platformVersion);
  if (pv < 8) {
    logger.warn(`iOS version ${opts.platformVersion} support has been ` +
                `deprecated and will be removed in a future version of ` +
                `Appium.`);
  }
  opts.localizableStringsDir = opts.localizableStringsDir || 'en.lproj';
  opts.autoAcceptAlerts = _.isNull(opts.autoAcceptAlerts) || _.isUndefined(opts.autoAcceptAlerts) ? false : opts.autoAcceptAlerts;
  opts.autoDismissAlerts = _.isNull(opts.autoDismissAlerts) || _.isUndefined(opts.autoDismissAlerts) ? false : opts.autoDismissAlerts;

  if ((opts.browserName || '').toLowerCase() === 'safari' ||
      (opts.app || '').toLowerCase() === 'safari' ||
      (opts.bundleId || '').toLowerCase() === SAFARI_BUNDLE) {
    // preparing a safari session
    if (opts.udid) {
      // on a real device
      opts.app = opts.app || SAFARI_LAUNCHER_APP_FILE;
      opts.bundleId = opts.bundleId || SAFARI_LAUNCHER_BUNDLE;
    } else {
      if (parseFloat(opts.platformVersion) <= 8) {
        // make sure args.app has something in it so we get to the right spots
        // in moveBuiltInApp()
        opts.app = 'safari';
        opts.bundleId = null;
      } else {
        opts.app = null;
        opts.bundleId = SAFARI_BUNDLE;
      }
    }
    opts.safari = true;
  }
}

function appIsPackageOrBundle (app) {
  return (/^([a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+)+$/).test(app);
}

async function removeInstrumentsSocket (sock) {
  logger.debug("Removing any remaining instruments sockets");
  await fs.rimraf(sock);
  logger.debug(`Cleaned up instruments socket ${sock}`);
}

async function getAndCheckXcodeVersion (caps) {
  let version;
  try {
    version = await xcode.getVersion(true);
  } catch (err) {
    logger.debug(err);
    logger.error(`Could not determine Xcode version: ${err.message}`);
    throw err;
  }
  let minorVersion = version.versionFloat;
  let pv = parseFloat(caps.platformVersion);
  // we deprecate Xcodes < 6.3, except for iOS 8.0 in which case we
  // support Xcode 6.0 as well
  if (minorVersion < 6.3 && (!(minorVersion === 6.0 && pv === 8.0))) {
    logger.warn(`Xcode version '${version.versionString}'. Support for Xcode ` +
                `${version.versionString} has been deprecated and will be removed ` +
                `in a future version. Please upgrade to version 6.3 or ` +
                `higher (or version 6.0.1 for iOS 8.0)`);
  }
  return version;
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
      cmd = await fs.which('idevice_id');
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
      logger.debug(`Detected udid as '${caps.udid}'`);
    } else {
      throw new Error("Could not detect udid.");
    }
  } else {
    logger.debug("Not auto-detecting udid.");
  }
}

async function readResource (resourcePath) {
  const data = await plist.parsePlistFile(resourcePath);
  const result = {};
  for (const [key, value] of _.toPairs(data)) {
    result[key] = _.isString(value) ? value : JSON.stringify(value);
  }
  return result;
}

async function parseLocalizableStrings (opts) {
  const {
    app,
    language = 'en',
    localizableStringsDir,
    stringFile,
  } = opts;

  if (!app) {
    logger.debug("Strings extraction is not supported if 'app' capability is not set");
    return {};
  }

  let lprojRoot;
  for (const subfolder of [`${language}.lproj`, localizableStringsDir, '']) {
    lprojRoot = path.resolve(app, subfolder);
    if (await fs.exists(lprojRoot)) {
      break;
    }
    logger.debug(`No '${lprojRoot}' resources folder has been found`);
  }
  logger.info(`Will extract resource strings from '${lprojRoot}'`);

  const resourcePaths = [];
  if (stringFile) {
    const dstPath = path.resolve(lprojRoot, stringFile);
    if (await fs.exists(dstPath)) {
      resourcePaths.push(dstPath);
    } else {
      logger.info(`No '${dstPath}' resource file has been found for '${app}'. ` +
        `Getting all the available strings from '${lprojRoot}'`);
    }
  }

  if (_.isEmpty(resourcePaths) && await fs.exists(lprojRoot)) {
    const resourceFiles = (await fs.readdir(lprojRoot))
      .filter((name) => _.some([STRINGS_RESOURCE, STRINGSDICT_RESOURCE], (x) => name.endsWith(x)))
      .map((name) => path.resolve(lprojRoot, name));
    resourcePaths.push(...resourceFiles);
  }
  logger.info(`Got ${resourcePaths.length} resource file(s) in '${lprojRoot}'`);

  if (_.isEmpty(resourcePaths)) {
    return {};
  }

  const resultStrings = {};
  for (const resourcePath of resourcePaths) {
    try {
      const data = await readResource(resourcePath);
      logger.debug(`Parsed ${_.keys(data).length} string(s) from '${resourcePath}'`);
      _.merge(resultStrings, data);
    } catch (e) {
      logger.warn(`Cannot parse '${resourcePath}' resource. Original error: ${e.message}`);
    }
  }

  logger.info(`Got ${_.keys(resultStrings).length} string(s) from '${lprojRoot}'`);
  return resultStrings;
}

async function setBundleIdFromApp (caps) {
  // This method will try to extract the bundleId from the app
  if (!caps.bundleId) {
    try {
      caps.bundleId = await extractBundleId(caps.app);
      logger.info(`Extracted bundleID: ${caps.bundleId} from app: ${caps.app}`);
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

function unwrapEl (el) {
  if (typeof el === 'object' && el.ELEMENT) {
    return el.ELEMENT;
  }
  return el;
}

async function clearLogs (locations) {
  logger.debug('Clearing log files');
  for (let location of locations) {
    if (await fs.exists(location)) {
      let size;
      try {
        let {stdout} = await exec('du', ['-sh', location]);
        size = stdout.trim().split(/\s+/)[0];
      } catch (ign) {}
      try {
        logger.debug(`Deleting '${location}'. ${size ? `Freeing ${size}.` : ''}`);
        await fs.rimraf(location);
      } catch (err) {
        logger.warn(`Unable to delete '${location}': ${err.message}`);
      }
    }
  }
  logger.debug('Finished clearing log files');
}

export default { rootDir, removeInstrumentsSocket, getAndCheckXcodeVersion, prepareIosOpts,
  appIsPackageOrBundle, getAndCheckIosSdkVersion,  detectUdid, parseLocalizableStrings,
  setBundleIdFromApp, shouldPrelaunchSimulator, setDeviceTypeInInfoPlist,
  getSimForDeviceString, unwrapEl, clearLogs };
