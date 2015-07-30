import xmlplist from 'plist';
import bplistCreate from 'bplist-creator';
import bplistParse from 'bplist-parser';
import { fs } from 'appium-support';
import logger from './logger';
import _ from 'lodash';
import B from 'bluebird';

let binaryPlist = true;
let _bplistParse = {
  parseFile: B.promisify(bplistParse.parseFile)
};

// XML Plist library helper
async function parseXmlPlistFile (plistFilename) {
  var xmlContent = await fs.readFile(plistFilename, 'utf8');
  return  xmlplist.parse(xmlContent);
}

async function parsePlistFile (plist) {
  let obj;
  try {
    obj = await _bplistParse.parseFile(plist);
  } catch (ign) {
    logger.debug("Could not parse plist file (as binary) at " + plist);
    logger.info("Will try to parse the plist file as XML");
    try {
      obj = await parseXmlPlistFile(plist);
    } catch (err) {
      logger.debug("Could not parse plist file (as XML) at " + plist);
      throw err;
    }
    logger.debug("Parsed app Info.plist (as XML)");
    binaryPlist = false;
    return obj;
  }
  binaryPlist = true;
  if (obj.length) {
    logger.debug("Parsed app Info.plist (as binary)");
    return obj[0];
  } else {
    throw new Error("Binary Info.plist appears to be empty");
  }
}

async function updatePlistFile (plist, updatedFields) {
  let obj;
  try {
    obj = await parsePlistFile(plist);
  } catch (err) {
    logger.error("Could not set the device type in Info.plist");
    throw err;
  }
  _.extend(obj, updatedFields);
  let newPlist = binaryPlist ? bplistCreate(obj) : xmlplist.build(obj);
  try {
    await fs.writeFile(plist, newPlist);
  } catch (err) {
    logger.error("Could not save new Info.plist");
    throw err;
  }
  logger.debug("Wrote new app Info.plist with device type");
}

export {parsePlistFile, updatePlistFile};
