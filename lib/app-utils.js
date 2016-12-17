import path from 'path';
import _ from 'lodash';
import { plist } from 'appium-support';
import log from './logger.js';


let plistObjects = {};

async function extractPlist (app) {
  let plistFile = path.resolve(app, 'Info.plist');
  try {
    return await plist.parsePlistFile(plistFile);
  } catch (err) {
    log.errorAndThrow(`Could not extract Info.plist from application: ${err.message}`);
  }
}

async function extractPlistEntry (app, entryName) {
  if (_.isUndefined(plistObjects[app])) {
    plistObjects[app] = await extractPlist(app);
  }

  return plistObjects[app][entryName];
}

async function extractAppDisplayName (app) {
  log.debug("Getting application name from app");
  return await extractPlistEntry(app, 'CFBundleDisplayName');
}

async function extractBundleId (app) {
  let bundleId = await extractPlistEntry(app, 'CFBundleIdentifier');
  log.debug(`Getting bundle ID from app '${app}': '${bundleId}'`);
  return bundleId;
}


export { extractAppDisplayName, extractBundleId };
