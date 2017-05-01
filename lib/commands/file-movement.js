import { errors } from 'appium-base-driver';
import { fs, system, mkdirp, zip } from 'appium-support';
import logger from '../logger';
import path from 'path';
import { exec } from 'teen_process';

let commands = {}, helpers = {}, extensions = {};

// TODO: more explicit error message for all the file-movement commands

/*
 *  Get the full path to an iOS simulator file.
 *  Calls cb(err, fullFilePath)
 *  /Some/Path                           fetches a file relative to the root of the device's filesystem.
 *  /Applications/AppName.app/Some/Path  fetches a file relative to the root of that Application's .app directory, adding in the GUID.
 *  So it looks something like: /Applications/GUID-GUID-GUID-GUID/Some/Path
 */
helpers.getSimFileFullPath = async function (remotePath) {
  let basePath = this.sim.getDir();
  let appName = null;

  if (this.opts.app) {
    let appNameRegex = new RegExp(`\\${path.sep}([\\w-]+\\.app)`);
    let appNameMatches = appNameRegex.exec(this.opts.app);
    if (appNameMatches) {
      appName = appNameMatches[1];
    }
  }
  // de-absolutize the path
  if (system.isWindows()) {
    if (remotePath.indexof("://") === 1) {
      remotePath = remotePath.slice(4);
    }
  } else {
    if (remotePath.indexOf("/") === 0) {
      remotePath = remotePath.slice(1);
    }
  }

  if (remotePath.indexOf(appName) === 0) {
    logger.debug("We want an app-relative file");

    let findPath = basePath;
    if (this.opts.platformVersion >= 8) {
      // the .app file appears in /Containers/Data and /Containers/Bundle both. We only want /Bundle
      findPath = path.resolve(basePath, "Containers", "Bundle");
    }
    findPath =  findPath.replace(/\s/g, '\\ ');

    let { stdout } = await exec('find', [findPath, '-name', appName]);
    let appRoot = stdout.replace(/\n$/, '');
    let subPath = remotePath.substring(appName.length + 1);
    return path.resolve(appRoot, subPath);
  } else {
    logger.debug("We want a sim-relative file");
    return path.resolve(basePath, remotePath);
  }
};

commands.pushFile = async function (remotePath, base64Data) {
  logger.debug(`Pushing ${remotePath} to iOS simulator`);

  if (this.isRealDevice()) {
    logger.debug("Unsupported: cannot write files to physical device");
    throw new errors.NotYetImplementedError();
  }

  let fullPath = await this.getSimFileFullPath(remotePath);

  logger.debug(`Attempting to write ${fullPath}...`);
  if (await fs.exists(fullPath)) {
    logger.debug(`${fullPath} already exists, deleting...`);
    await fs.unlink(fullPath);
  }
  await mkdirp(path.dirname(fullPath));
  let content = new Buffer(base64Data, 'base64');
  await fs.writeFile(fullPath, content);
  logger.debug(`Wrote ${content.length} bytes to ${fullPath}`);
};

commands.pullFile = async function (remotePath) {
  logger.debug(`Pulling ${remotePath} from sim`);

  if (this.isRealDevice()) {
    throw new errors.NotYetImplementedError();
  }
  let fullPath = await this.getSimFileFullPath(remotePath);

  logger.debug(`Attempting to read ${fullPath}`);
  let data = await fs.readFile(fullPath, {encoding: 'base64'});
  return data;
};

commands.pullFolder = async function (remotePath) {
  logger.debug(`Pulling '${remotePath}' from sim`);

  if (this.isRealDevice()) {
    throw new errors.NotYetImplementedError();
  }

  let fullPath = await this.getSimFileFullPath(remotePath);

  logger.debug(`Adding ${fullPath} to an in-memory zip archive`);
  let buffer = await zip.toInMemoryZip(fullPath);

  logger.debug("Converting in-memory zip file to base64 encoded string");
  let data = buffer.toString('base64');
  logger.debug("Returning in-memory zip file as base54 encoded string");
  return data;
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
