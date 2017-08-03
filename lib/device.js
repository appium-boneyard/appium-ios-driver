import _ from 'lodash';
import { getDeviceString } from 'appium-ios-simulator';
import path from 'path';
import utils from './utils';
import logger from './logger';


async function checkSimulatorAvailable (opts, sdkVersion, availableDevices) {
  if (sdkVersion < 7.1) {
    logger.debug('Instruments v < 7.1, not checking device string support');
    return;
  }

  logger.debug('Checking whether our device string is supported');

  let dString = await getAdjustedDeviceName(opts);
  let noDevicesError = function () {
    let msg = `Could not find a device to launch. You requested ` +
              `'${dString}', but the available devices were: ` +
              JSON.stringify(availableDevices);
    logger.errorAndThrow(msg);
  };
  if (sdkVersion >= 8) {
    let sim = utils.getSimForDeviceString(dString, availableDevices);
    if (sim[0] === null || sim[1] === null) {
      noDevicesError();
    }
    logger.debug(`iOS sim UDID is ${sim[1]}`);
    return sim[1];
  } else if (!_.includes(availableDevices, dString)) {
    noDevicesError();
  }
}

async function getAdjustedDeviceName (opts) {
  opts._adjustedDeviceName = opts._adjustedDeviceName || await getDeviceString(opts);
  return opts._adjustedDeviceName;
}

// TODO: what to do with this?
async function moveBuiltInApp (/*sim*/) {
  // call sim function once it is in place
}

async function runSimulatorReset (sim, opts, keepApp) {
  if (!opts.reset && !opts.fullReset) {
    logger.debug('Reset not set, not ending sim');
    return;
  }

  logger.debug('Running ios sim reset flow');

  // The simulator process must be ended before we delete applications.
  await endSimulator(sim);

  if (opts.fullReset) {
    logger.debug('Full reset is on, so erasing simulator');
    await fullResetSimulator(sim);
  } else if (opts.reset) {
    await resetSimulator(sim, opts, keepApp);
  }
}

async function fullResetSimulator (sim) {
  logger.debug('Cleaning the simulator');
  if (sim) {
    await sim.clean();
  }
}

async function resetSimulator (sim, opts, keepApp) {
  if (!sim) return; // eslint-disable-line curly

  logger.debug('Cleaning sim state.');
  try {
    await clearAppData(sim, opts, keepApp);
  } catch (err) {
    logger.warn(err);
    logger.warn("Could not reset simulator. Leaving as is.");
  }
}

async function endSimulator (sim) {
  if (!sim) return; // eslint-disable-line curly

  logger.debug('Killing the simulator');
  await sim.shutdown();
}

async function isolateSimulatorDevice (sim, opts, sdkVersion) {
  if (opts.isolateSimDevice && sdkVersion >= 8) {
    await sim.isolateSim();
  }
}

async function clearAppData  (sim, opts, keepApp) {
  if (!keepApp && opts.app && opts.bundleId) {
    await sim.cleanCustomApp(path.basename(opts.app), opts.bundleId);
  }
}

async function resetRealDevice (device, opts) {
  if (opts.bundleId && opts.fullReset) {
    let bundleId = opts.bundleId;
    logger.debug(`Full reset requested. Will try to uninstall the app '${bundleId}'.`);
    if (!await device.isInstalled(bundleId)) {
      logger.debug('App not installed. No need to uninstall');
      return;
    }
    try {
      await device.remove(bundleId);
    } catch (err) {
      logger.error(`Could not remove '${bundleId}' from device`);
      throw err;
    }
    logger.debug(`Removed ${bundleId}`);
  }
}

async function runRealDeviceReset (device, opts) {
  if (opts.reset || opts.fullReset) {
    logger.debug("Running ios real device reset flow");
    if (opts.reset) {
      await resetRealDevice(device, opts);
    }
  } else {
    logger.debug("Reset not set, continuing");
  }
}


export { runSimulatorReset, isolateSimulatorDevice, checkSimulatorAvailable,
         moveBuiltInApp, getAdjustedDeviceName, endSimulator, runRealDeviceReset };
