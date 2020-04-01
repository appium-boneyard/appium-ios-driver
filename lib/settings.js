import _ from 'lodash';
import logger from './logger';


const SETTINGS_CAPS = [
  'locationServicesEnabled',
  'locationServicesAuthorized',
];
const SAFARI_SETTINGS_CAPS = [
  'safariAllowPopups',
  'safariIgnoreFraudWarning',
  'safariOpenLinksInBackground',
];

async function launchAndQuitSimulator (sim, safari) {
  logger.debug('No simulator directories found.');
  return await sim.launchAndQuit(safari);
}

function checkPreferences (settings, opts = {}) {
  for (let setting of settings) {
    if (_.has(opts, setting)) {
      return true;
    }
  }
  return false;
}

async function setLocaleAndPreferences (sim, opts, safari = false, shutdownFn = _.noop) {
  const localConfig = await setLocale(sim, opts, {}, safari);
  const prefsUpdated = await setPreferences(sim, opts, safari);
  if (localConfig._updated || prefsUpdated) {
    logger.debug('Updated settings. Rebooting the simulator if it is already open');
    await shutdownFn(sim);
  } else {
    logger.debug('Setting did not need to be updated');
  }
  delete localConfig._updated;
  return localConfig;
}

// pass in the simulator so that other systems that use the function can supply
// whatever they have
async function setLocale (sim, opts, localeConfig = {}, safari = false) {
  if (!opts.language && !opts.locale && !opts.calendarFormat) {
    logger.debug('No reason to set locale');
    return {
      _updated: false,
    };
  }

  // we need the simulator to have its directories in place
  if (await sim.isFresh()) {
    await launchAndQuitSimulator(sim, safari);
  }

  logger.debug('Setting locale information');
  localeConfig = {
    language: opts.language || localeConfig.language,
    locale: opts.locale || localeConfig.locale,
    calendarFormat: opts.calendarFormat || localeConfig.calendarFormat,
    _updated: false,
  };

  try {
    let updated = await sim.updateLocale(opts.language, opts.locale, opts.calendarFormat);
    if (updated) {
      localeConfig._updated = true;
    }
  } catch (e) {
    logger.errorAndThrow(`Appium was unable to set locale info: ${e}`);
  }

  return localeConfig;
}

async function setPreferences (sim, opts, safari = false) {
  let needToSetPrefs = checkPreferences(SETTINGS_CAPS, opts);
  let needToSetSafariPrefs = checkPreferences(SAFARI_SETTINGS_CAPS, opts);
  if (!needToSetPrefs && !needToSetSafariPrefs) {
    logger.debug('No iOS / app preferences to set');
    return false;
  }

  logger.debug('Setting iOS and app preferences');

  if (await sim.isFresh()) {
    await launchAndQuitSimulator(sim, safari);
  }

  let updated = false;
  try {
    if (needToSetPrefs) {
      updated = await setLocServicesPrefs(sim, opts);
    }
  } catch (e) {
    logger.error('Error setting location services preferences, prefs will not work');
    logger.error(e);
  }

  try {
    if (needToSetSafariPrefs) {
      updated = await setSafariPrefs(sim, opts) || updated;
    }
  } catch (e) {
    logger.error('Error setting safari preferences, prefs will not work');
    logger.error(e);
  }

  return updated;
}

async function setLocServicesPrefs (sim, opts = {}) {
  let locServ = _.find([opts.locationServicesEnabled, opts.locationServicesAuthorized], (c) => !_.isUndefined(c));
  if (!_.isUndefined(locServ)) {
    locServ = locServ ? 1 : 0;
    logger.debug(`Setting location services to ${locServ}`);
    await sim.updateSettings('locationServices', {
      LocationServicesEnabled: locServ,
      'LocationServicesEnabledIn7.0': locServ,
      'LocationServicesEnabledIn8.0': locServ
    });
  }
  if (!_.isUndefined(opts.locationServicesAuthorized)) {
    if (!opts.bundleId) {
      let msg = "Can't set location services for app without bundle ID";
      logger.errorAndThrow(msg);
    }
    let locAuth = !!opts.locationServicesAuthorized;
    if (locAuth) {
      logger.debug('Authorizing location services for app');
    } else {
      logger.debug('De-authorizing location services for app');
    }
    await sim.updateLocationSettings(opts.bundleId, locAuth);
  }
}

async function setSafariPrefs (sim, opts = {}) {
  let safariSettings = {};

  if (_.has(opts, 'safariAllowPopups')) {
    const val = !!opts.safariAllowPopups;
    logger.debug(`Setting javascript window opening to '${val}'`);
    safariSettings.WebKitJavaScriptCanOpenWindowsAutomatically = val;
    safariSettings.JavaScriptCanOpenWindowsAutomatically = val;
  }
  if (_.has(opts, 'safariIgnoreFraudWarning')) {
    const val = !opts.safariIgnoreFraudWarning;
    logger.debug(`Setting fraudulent website warning to '${val}'`);
    safariSettings.WarnAboutFraudulentWebsites = val;
  }
  if (_.has(opts, 'safariOpenLinksInBackground')) {
    const val = opts.safariOpenLinksInBackground ? 1 : 0;
    logger.debug(`Setting opening links in background to '${!!val}'`);
    safariSettings.OpenLinksInBackground = val;
  }
  return (_.size(safariSettings) > 0)
    ? await sim.updateSafariSettings(safariSettings)
    : false;
}

export { setLocale, setPreferences, setLocaleAndPreferences };
