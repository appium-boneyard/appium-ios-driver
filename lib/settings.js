import logger from './logger';
import _  from 'underscore';
import { fs, mkdirp, util } from 'appium-support';
import path from 'path';
import bplistCreate from 'bplist-creator';
import bplistParse from 'bplist-parser';
import xmlplist  from 'plist';

let settings = {};
let plists = {
  locationServices: 'com.apple.locationd.plist',
  webInspector: 'com.apple.webInspector.plist',
  mobileSafari: 'com.apple.mobilesafari.plist',
  webFoundation: 'com.apple.WebFoundation.plist',
  preferences: 'com.apple.Preferences.plist',
  locationClients: 'clients.plist',
  locationCache: 'cache.plist',
  userSettings: 'UserSettings.plist',
  effUserSettings: 'EffectiveUserSettings.plist'
};

let prefs = {
  mobileSafari: {
    OpenLinksInBackground: [0, 1],
    WebKitJavaScriptCanOpenWindowsAutomatically: [true, false],
    JavaScriptCanOpenWindowsAutomatically: [true, false],
    SearchEngineStringSetting: ['Google', 'Yahoo!', 'Bing'],
    SafariDoNotTrackEnabled: [true, false],
    SuppressSearchSuggestions: [true, false],
    SpotlightSuggestionsEnabled: [true, false],
    SpeculativeLoading: [true, false],
    WarnAboutFraudulentWebsites: [true, false],
    ReadingListCellularFetchingEnabled: [true, false],
    WebKitJavaScriptEnabled: [true, false],
    JavaScriptEnabled: [true, false],
    DisableWebsiteSpecificSearch: [true, false]
  },
  webFoundation: {
    NSHTTPAcceptCookies: ['never', 'always', 'current page']
  },
  webInspector: {
    RemoteInspectorEnabled: [true, false]
  },
  locationServices: {
    LocationServicesEnabled: [0, 1],
    'LocationServicesEnabledIn7.0': [0, 1],
    'LocationServicesEnabledIn8.0': [0, 1],
    ObsoleteDataDeleted: [true, false]
  },
  preferences: {
    KeyboardCapsLock: [true, false],
    KeyboardAutocapitalization: [true, false],
    KeyboardAutocorrection: [true, false],
    KeybordCheckSpelling: [true, false],
    KeyboardPeriodShortcut: [true, false]
  }
};

let getPrefsDirs = function (sim) {
  return util.multiResolve(sim.getDirs(), "Library", "Preferences");
};


let getPlistPaths = function (plist, sim) {
  let files;
  let file = plists[plist];
  let bases = getPrefsDirs(sim);
  if (plist === 'mobileSafari' && parseFloat(sim.platformVer) >= 7) {
    bases = util.multiResolve(sim.getSafariDirs(), "Library", "Preferences");
  } else if (plist === 'locationClients') {
    bases = util.multiResolve(sim.getDirs(), "Library", "Caches", "locationd");
  } else if (plist === 'locationCache') {
    let bases2 = util.multiResolve(sim.getDirs(), "Library", "Caches", "locationd");
    files = util.multiResolve(bases, file);
    files = files.concat(util.multiResolve(bases2, file));
    return files;
  } else if (plist === 'userSettings') {
    files = util.multiResolve(sim.getDirs(), "Library", "ConfigurationProfiles",
                         file);
    files = files.concat(util.multiResolve(sim.getDirs(), "Library",
                         "ConfigurationProfiles", plists.effUserSettings));
    files = files.concat(util.multiResolve(sim.getDirs(), "Library",
                         "ConfigurationProfiles", "PublicInfo",
                         "PublicEffectiveUserSettings.plist"));
    return files;
  }

  return util.multiResolve(bases, file);
};

let checkValidSettings = function (forPlist, prefSet) {
  let e = null;
  if (!_.has(plists, forPlist) || !_.has(prefs, forPlist)) {
    e = new Error("plist type " + forPlist + " doesn't exist");
  }

  _.each(prefSet, function (prefValue, prefName) {
    if (!_.has(prefs[forPlist], prefName)) {
      e = new Error("plist type " + forPlist + " has no option " +
                        prefName);
    }
    if (!_.contains(prefs[forPlist][prefName], prefValue)) {
      e = new Error("plist type " + forPlist + ", option " + prefName +
                        " has no possible value " + prefValue);
    }
  });

  if (e !== null) {
    logger.error(e.message);
    throw e;
  }
};

settings.writeSettings = function (forPlist, prefSetPerFile, bypassCheck,
    makeDirs) {
  if (typeof makeDirs === "undefined") {
    makeDirs = false;
  }
  let filesWritten = 0;
  _.each(prefSetPerFile, function (prefSet, plistPath) {
    logger.debug("Writing settings for " + forPlist + " to " + plistPath + ":");
    logger.debug(JSON.stringify(prefSet));
    if (!bypassCheck) {
      checkValidSettings(forPlist, prefSet);
    }
    let baseDir = path.dirname(plistPath);
    if (!fs.existsSync(baseDir)) {
      logger.warn("Base directory " + baseDir + " doesn't exist, creating it");
      mkdirp.sync(baseDir);
    }
    prefSet = [prefSet];  // need to wrap in an array to get written correctly
    try {
      fs.unlinkSync(plistPath);
    } catch (e) {}
    try {
      fs.writeFileSync(plistPath, bplistCreate(prefSet));
      filesWritten++;
    } catch (e) {
      logger.warn("Could not write to " + plistPath);
    }
  });
  if (filesWritten === 0) {
    logger.warn("Could not write any settings files; is the first time " +
        "you've launched the sim? The directories might not exist yet");
  }
};

settings.updateSettings = function (sim, forPlist, prefSet) {
  logger.debug("Updating settings for " + forPlist);
  checkValidSettings(forPlist, prefSet);
  let prefSetPerFile = {};
  let curSettings = settings.getSettings(sim, forPlist);
  _.each(curSettings, function (settingSet, file) {
    _.each(prefSet, function (prefValue, prefName) {
      settingSet[prefName] = prefValue;
    });
    prefSetPerFile[file] = settingSet;
  });
  settings.writeSettings(forPlist, prefSetPerFile, true);
};

settings.updateLocationSettings = function (sim, bundleId, authorized) {
  let weirdLocKey = "com.apple.locationd.bundle-/System/Library/" +
                    "PrivateFrameworks/AOSNotification.framework";
  let newPrefs = {
    BundleId: bundleId,
    Authorized: !!authorized,
    Whitelisted: false,
  };
  let newCachePrefs = {
    LastFenceActivityTimestamp: 412122103.232983,
    CleanShutdown: true
  };
  let prefSetPerFile = {};
  let cachePrefSetPerFile = {};
  let curCacheSettings = settings.getSettings(sim, 'locationCache');
  _.each(curCacheSettings, function (settingSet, file) {
    cachePrefSetPerFile[file] = _.extend(_.clone(newCachePrefs), settingSet);
  });
  let curSettings = settings.getSettings(sim, 'locationClients');
  _.each(curSettings, function (settingSet, file) {
    // add this random data to the clients.plist since it always seems to be there
    if (!_.has(settingSet, weirdLocKey)) {
      settingSet[weirdLocKey] = {
        BundlePath: "/System/Library/PrivateFrameworks/AOSNotification.framework",
        Whitelisted: false,
        Executable: "",
        Registered: ""
      };
    }
    // now add our app's data
    if (!_.has(settingSet, bundleId)) {
      settingSet[bundleId] = {};
    }
    _.extend(settingSet[bundleId], newPrefs);
    if (!_.has(settingSet, 'Executable')) {
      settingSet.Executable = "";
    }
    if (!_.has(settingSet, 'Registered')) {
      settingSet.Registered = "";
    }
    prefSetPerFile[file] = settingSet;
  });
  settings.writeSettings('locationClients', prefSetPerFile, true);
  settings.writeSettings('locationCache', cachePrefSetPerFile, true);
};

settings.updateSafariSettings = function (sim, settingSet) {
  settings.updateSafariUserSettings(sim, settingSet);
  settings.updateSettings(sim, 'mobileSafari', settingSet);
};

settings.updateSafariUserSettings = function (sim, settingSet) {
  // add extra stuff to UserSettings.plist and EffectiveUserSettings.plist
  let newUserSettings = {};
  if (_.has(settingSet, 'WebKitJavaScriptEnabled')) {
    newUserSettings.safariAllowJavaScript = settingSet.WebKitJavaScriptEnabled;
  }
  if (_.has(settingSet, 'WebKitJavaScriptCanOpenWindowsAutomatically')) {
    newUserSettings.safariAllowPopups = settingSet.WebKitJavaScriptCanOpenWindowsAutomatically;
  }
  if (_.has(settingSet, 'WarnAboutFraudulentWebsites')) {
    newUserSettings.safariForceFraudWarning = !settingSet.WarnAboutFraudulentWebsites;
  }
  if (_.size(newUserSettings) > 0) {
    logger.debug("Updating UserSettings.plist and friends");
    let userSettingsPerFile = {};
    let curUserSettings = settings.getSettings(sim, 'userSettings');
    _.each(curUserSettings, function (userSettingSet, file) {
      if (!_.has(userSettingSet, 'restrictedBool')) {
        userSettingSet.restrictedBool = {};
      }
      let useValueTypePlist = false;
      if (userSettingSet.restrictedBool && userSettingSet.restrictedBool.safariAllowJavaScript && _.has(userSettingSet.restrictedBool.safariAllowJavaScript, 'value')) {
        useValueTypePlist = true;
      }
      if (useValueTypePlist) {
        _.each(newUserSettings, function (value, key) {
          userSettingSet.restrictedBool[key].value = value;
        });
      } else {
        _.extend(userSettingSet.restrictedBool, newUserSettings);
      }
      userSettingsPerFile[file] = userSettingSet;
    });
    settings.writeSettings('userSettings', userSettingsPerFile, true);
  }
};

let getPlistData = function (file) {
  var data;
  if (fs.existsSync(file)) {
    var fileData = fs.readFileSync(file);
    try {
      data = bplistParse.parseBuffer(fileData)[0];
    } catch (err) {
      if (err.message.indexOf("Invalid binary plist") !== -1) {
        logger.debug("Plist was not binary format, retrying with xml");
        data = xmlplist.parse(fileData.toString());
      } else {
        throw err;
      }
    }
  } else {
    throw new Error("Settings file " + file + " did not exist");
  }
  return data;
};

settings.getSettings = function (sim, forPlist) {
  let files = getPlistPaths(forPlist, sim);
  let bplists = {};
  _.each(files, function (file) {
    logger.debug("Getting current settings for " + forPlist + " from " + file);
    try {
      bplists[file] = getPlistData(file);
    } catch (err) {
      bplists[file] = {};
      logger.warn(err.message);
    }
  });
  return bplists;
};

settings.locServicesDirsExist = function (sim) {
  return getPlistPaths('locationClients', sim).length > 0;
};

export default settings;
