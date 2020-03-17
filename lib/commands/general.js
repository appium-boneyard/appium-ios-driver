import { errors } from 'appium-base-driver';
import _ from 'lodash';
import js2xml from 'js2xmlparser2';
import log from '../logger';
import { fs, util } from 'appium-support';
import { exec } from 'teen_process';
import * as utils from '../utils';
import Simctl from 'node-simctl';
import moment from 'moment';

let commands = {}, helpers = {}, extensions = {};

const MOMENT_FORMAT_ISO8601 = 'YYYY-MM-DDTHH:mm:ssZ';

commands.active = async function active () {
  if (this.isWebContext()) {
    return await this.executeAtom('active_element', []);
  } else {
    return await this.uiAutoClient.sendCommand('au.getActiveElement()');
  }
};

/**
 * Retrieves the current device's timestamp.
 *
 * @param {string} format - The set of format specifiers. Read
 *                          https://momentjs.com/docs/ to get the full list of supported
 *                          datetime format specifiers. The default format is
 *                          `YYYY-MM-DDTHH:mm:ssZ`, which complies to ISO-8601
 * @returns Formatted datetime string or the raw command output if formatting fails
 */
commands.getDeviceTime = async function getDeviceTime (format = MOMENT_FORMAT_ISO8601) {
  log.info('Attempting to capture iOS device date and time');
  let cmd;
  let args;
  let inputFormat;
  if (this.isRealDevice()) {
    try {
      cmd = await fs.which('idevicedate');
    } catch (err) {
      log.errorAndThrow('Could not capture device date and time using libimobiledevice idevicedate. ' +
                        'Libimobiledevice is probably not installed');
    }
    log.info(`Found idevicedate: '${cmd}'`);
    // https://github.com/libimobiledevice/libimobiledevice/blob/26373b334889f5ae2e2737ff447eb25b1700fa2f/tools/idevicedate.c#L129
    args = ['-u', this.opts.udid];
    inputFormat = 'ddd MMM DD HH:mm:ss z YYYY';
  } else {
    log.warn('On simulator. Assuming device time is the same as host time');
    cmd = 'date';
    args = ['+%Y-%m-%dT%H:%M:%S%z'];
    inputFormat = 'YYYY-MM-DDTHH:mm:ssZZ';
  }
  const stdout = (await exec(cmd, args)).stdout.trim();
  log.debug(`Got the following output out of '${cmd} ${args.join(' ')}': ${stdout}`);
  const parsedTimestamp = moment.utc(stdout, inputFormat);
  if (!parsedTimestamp.isValid()) {
    log.warn(`Cannot parse the timestamp '${stdout}' returned by '${cmd}' command. Returning it as is`);
    return stdout;
  }
  return parsedTimestamp.utcOffset(parsedTimestamp._tzm || 0).format(format);
};

commands.hideKeyboard = async function hideKeyboard (strategy, ...possibleKeys) {
  possibleKeys.pop(); // last parameter is the session id
  let cmd;
  let key = _.find(possibleKeys, (k) => k);
  if (key) {
    strategy = strategy || 'pressKey';
    cmd = `au.hideKeyboard('${strategy}', '${key}')`;
  } else {
    strategy = strategy || 'default';
    cmd = `au.hideKeyboard('${strategy}')`;
  }
  await this.uiAutoClient.sendCommand(cmd);
};

commands.getPageSource = async function getPageSource () {
  if (this.isWebContext()) {
    const script = 'return document.documentElement.outerHTML';
    return await this.executeAtom('execute_script', [script, []]);
  } else {
    return await this.getNativePageSource();
  }
};

helpers.getNativePageSource = async function getNativePageSource () {
  let jsonSource = await this.getSourceForElementForXML();
  if (typeof jsonSource === 'string') {
    jsonSource = JSON.parse(jsonSource);
  }
  let xmlSource = js2xml('AppiumAUT', jsonSource, {
    wrapArray: {enabled: false, elementName: 'element'},
    declaration: {include: true},
    prettyPrinting: {indentString: '    '}
  });
  return xmlSource;
};

commands.background = async function background (secs) {
  await this.uiAutoClient.sendCommand(`au.background(${secs})`);
};

commands.lock = async function lock (secs) {
  if (!secs) {
    log.debug('No seconds parameter. Using 0 seconds');
    secs = 0;
  }
  await this.uiAutoClient.sendCommand(`au.lock(${secs})`);
};

commands.closeApp = async function closeApp () {
  let appName = this.opts.app || this.opts.bundleId;
  try {
    await this.stop();
    log.info(`Successfully closed the '${appName}' app.`);
  } catch (err) {
    log.warn(`Something went wrong while closing the '${appName}' app.`);
    throw err;
  }
};

commands.launchApp = async function launchApp () {
  let appName = this.opts.app || this.opts.bundleId;
  try {
    await this.start();
    log.info(`Successfully launched the '${appName}' app.`);
  } catch (err) {
    log.warn(`Something went wrong while launching the '${appName}' app.`);
    throw err;
  }
};

commands.removeApp = async function removeApp (bundleId) {
  if (this.isRealDevice()) {
    await this.realDevice.remove(bundleId);
  } else {
    await this.sim.removeApp(bundleId);
  }
};

commands.keys = async function keys (keys) {
  if (this.isWebContext()) {
    let el = await this.active();
    if (_.isUndefined(el.ELEMENT)) {
      throw new errors.NoSuchElementError();
    }
    await this.setValue(keys, el.ELEMENT);
  } else {
    if (_.isArray(keys)) {
      keys = keys.join('');
    }
    if (!_.isString(keys)) {
      keys = keys.toString();
    }
    keys = util.escapeSpecialChars(keys, "'");
    let command = `au.sendKeysToActiveElement('${keys}')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.setGeoLocation = async function setGeoLocation (location) {
  // TODO: check the hasOptions bit, the method signature should be location, option

  // let hasOptions = altitude !== null || horizontalAccuracy !== null || verticalAccuracy !== null || course !== null || speed !== null;
  // if (hasOptions) {
  //   let options = {};
  //   if (altitude !== null) {
  //     options.altitude = altitude;
  //   }
  //   if (horizontalAccuracy !== null) {
  //     options.horizontalAccuracy = horizontalAccuracy;
  //   }
  //   if (verticalAccuracy !== null) {
  //     options.verticalAccuracy = verticalAccuracy;
  //   }
  //   if (course !== null) {
  //     options.course = course;
  //   }
  //   if (speed !== null) {
  //     options.speed = speed;
  //   }
  //   await this.uiAutoClient.sendCommand(
  //     `target.setLocationWithOptions(${JSON.stringify(coordinates)}, ${JSON.stringify(options)})`);
  // } else {
  await this.uiAutoClient.sendCommand(`target.setLocation(${JSON.stringify(location)})`);
  // }
};

commands.getWindowSize = async function getWindowSize (windowHandle = 'current') {
  if (windowHandle !== 'current') {
    throw new errors.NotYetImplementedError('Currently only getting current window size is supported.');
  }

  if (this.isWebContext()) {
    return await this.executeAtom('get_window_size', []);
  } else {
    return await this.uiAutoClient.sendCommand('au.getWindowSize()');
  }
};

// For W3C
commands.getWindowRect = async function getWindowRect () {
  const {width, height} = await this.getWindowSize();
  return {
    width,
    height,
    x: 0,
    y: 0
  };
};

commands.getStrings = async function getStrings (language, stringFile = null) {
  log.debug(`Gettings strings for language '${language}' and string file '${stringFile}'`);
  return await utils.parseLocalizableStrings(Object.assign({}, this.opts, {
    language,
    stringFile,
    strictMode: true,
  }));
};

commands.setUrl = async function setUrl (url) {
  log.debug(`Attempting to set url '${url}'`);
  if (!this.isWebContext()) {
    // use xcrun to open deeplink
    await new Simctl({
      udid: this.opts.udid || this.sim.udid,
    }).openUrl(url);
    return;
  }
  this.setCurrentUrl(url);
  // make sure to clear out any leftover web frames
  this.curWebFrames = [];
  await this.remote.navToUrl(url);
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
