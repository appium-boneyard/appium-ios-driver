import uuid from 'uuid-js';
import B from 'bluebird';
import path from 'path';
import { retry } from 'asyncbox';
import { fs, mkdirp, imageUtil } from 'appium-support';
import { rotateImage } from '../uiauto/utils';
import logger from '../logger';
import { errors } from 'appium-base-driver';


let commands = {}, helpers = {}, extensions = {};

commands.getScreenshot = async function () {
  let guid = uuid.create();
  let shotFile = `screenshot${guid}`;

  let shotFolder = path.resolve(this.opts.tmpDir, 'appium-instruments/Run 1/');
  if (!(await fs.exists(shotFolder))) {
    logger.debug(`Creating folder '${shotFolder}'`);
    await mkdirp(shotFolder);
  }

  let shotPath = path.resolve(shotFolder, `${shotFile}.png`);
  logger.debug(`Taking screenshot: '${shotPath}'`);

  let takeScreenShot = async () => {
    await this.uiAutoClient.sendCommand(`au.capture('${shotFile}')`);

    let screenshotWaitTimeout = (this.opts.screenshotWaitTimeout || 10) * 1000;
    logger.debug(`Waiting ${screenshotWaitTimeout} ms for screenshot to be generated.`);
    let startMs = Date.now();

    let success = false;
    while ((Date.now() - startMs) < screenshotWaitTimeout) {
      if (await fs.hasAccess(shotPath)) {
        success = true;
        break;
      }
      await B.delay(300);
    }
    if (!success) {
      throw new errors.UnknownError('Timed out waiting for screenshot file');
    }

    // check the rotation, and rotate if necessary
    if (await this.getOrientation() === 'LANDSCAPE') {
      logger.debug('Rotating landscape screenshot');
      await rotateImage(shotPath, -90);
    }
    return await fs.readFile(shotPath);
  };

  // Retrying the whole screenshot process for three times.
  let data = await retry(3, takeScreenShot);
  return new Buffer(data).toString('base64');
};

commands.getViewportScreenshot = async function () {
  const windowSize = await this.getWindowSize();
  const scale = await this.getDevicePixelRatio();
  // status bar height comes in unscaled, so scale it
  const statusBarHeight = await this.getStatusBarHeight() * scale;
  const screenshot = await this.getScreenshot();
  let rect = {
    left: 0,
    top: statusBarHeight,
    width: windowSize.width * scale,
    height: windowSize.height * scale - statusBarHeight
  };
  let newScreenshot = await imageUtil.cropBase64Image(screenshot, rect);
  return newScreenshot;
};

Object.assign(extensions, commands, helpers);
export {commands, helpers};
export default extensions;
