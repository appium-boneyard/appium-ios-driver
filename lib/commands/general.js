import { errors } from 'appium-base-driver';
import _ from 'lodash';
import js2xml from "js2xmlparser2";
import log from '../logger';
import { fs, util } from 'appium-support';
import { exec } from 'teen_process';
import utils from '../utils';
import { openUrl } from 'node-simctl';

let commands = {}, helpers = {}, extensions = {};

commands.active = async function () {
  if (this.isWebContext()) {
    return await this.executeAtom('active_element', []);
  } else {
    return await this.uiAutoClient.sendCommand("au.getActiveElement()");
  }
};

commands.getDeviceTime = async function () {
  log.info('Attempting to capture iOS device date and time');
  if (this.isRealDevice()) {
    try {
      let idevicedate = await fs.which('idevicedate');
      log.info(`Found idevicedate: '${idevicedate}'`);
      let {stdout} = await exec(idevicedate, ['-u', this.opts.udid]);
      stdout = stdout.trim();
      try {
        let date = new Date(stdout);
        return date.toString();
      } catch (err) {
        // sometimes `idevicedate` returns an un-parsable format
        // in which case, we just want to return the output and
        // let the client deal with it
        log.debug(`Unable to parse date '${stdout}'. Returning as is`);
        return stdout;
      }
    } catch (err) {
      log.errorAndThrow('Could not capture device date and time using libimobiledevice idevicedate. ' +
                     'Libimobiledevice is probably not installed');
    }
  } else {
    log.warn('On simulator. Assuming device time is the same as host time');
    return new Date().toString();
  }
};

commands.hideKeyboard = async function (strategy, ...possibleKeys) {
  possibleKeys.pop(); // last parameter is the session id
  let cmd;
  let key = _.find(possibleKeys, (k) => {return k;});
  if (key) {
    strategy = strategy || 'pressKey';
    cmd = `au.hideKeyboard('${strategy}', '${key}')`;
  } else {
    strategy = strategy || 'default';
    cmd = `au.hideKeyboard('${strategy}')`;
  }
  await this.uiAutoClient.sendCommand(cmd);
};

commands.getPageSource = async function () {
  if (this.isWebContext()) {
    let cmd = 'document.getElementsByTagName("html")[0].outerHTML';
    return await this.remote.execute(cmd);
  } else {
    let jsonSource = await this.getSourceForElementForXML();
    if (typeof jsonSource === "string") {
      jsonSource = JSON.parse(jsonSource);
    }
    let xmlSource = js2xml("AppiumAUT", jsonSource, {
      wrapArray: {enabled: false, elementName: "element"},
      declaration: {include: true},
      prettyPrinting: {indentString: "    "}
    });
    return xmlSource;
  }
};

commands.background = async function (secs) {
  await this.uiAutoClient.sendCommand(`au.background(${secs})`);
};

commands.lock = async function (secs) {
  if (!secs) {
    log.debug('No seconds parameter. Using 0 seconds');
    secs = 0;
  }
  await this.uiAutoClient.sendCommand(`au.lock(${secs})`);
};

commands.closeApp = async function () {
  let appName = this.opts.app || this.opts.bundleId;
  try {
    await this.stop();
    log.info(`Successfully closed the '${appName}' app.`);
  } catch (err) {
    log.warn(`Something went wrong while closing the '${appName}' app.`);
    throw err;
  }
};

commands.launchApp = async function () {
  let appName = this.opts.app || this.opts.bundleId;
  try {
    await this.start();
    log.info(`Successfully launched the '${appName}' app.`);
  } catch (err) {
    log.warn(`Something went wrong while launching the '${appName}' app.`);
    throw err;
  }
};

commands.removeApp = async function (bundleId) {
  if (this.isRealDevice()) {
    await this.realDevice.remove(bundleId);
  } else {
    await this.sim.removeApp(bundleId);
  }
};

commands.keys = async function (keys) {
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

commands.setGeoLocation = async function (location) {
  // TODO: check the hasOptions bit, the method signature should be location, option

  //let hasOptions = altitude !== null || horizontalAccuracy !== null || verticalAccuracy !== null || course !== null || speed !== null;
  //if (hasOptions) {
    //let options = {};
    //if (altitude !== null) {
      //options.altitude = altitude;
    //}
    //if (horizontalAccuracy !== null) {
      //options.horizontalAccuracy = horizontalAccuracy;
    //}
    //if (verticalAccuracy !== null) {
      //options.verticalAccuracy = verticalAccuracy;
    //}
    //if (course !== null) {
      //options.course = course;
    //}
    //if (speed !== null) {
      //options.speed = speed;
    //}
    //await this.uiAutoClient.sendCommand(
      //`target.setLocationWithOptions(${JSON.stringify(coordinates)}, ${JSON.stringify(options)})`);
  //} else {
  await this.uiAutoClient.sendCommand(`target.setLocation(${JSON.stringify(location)})`);
  //}
};

commands.getWindowSize = async function (windowHandle="current") {
  if (windowHandle !== "current") {
    throw new errors.NotYetImplementedError("Currently only getting current window size is supported.");
  }

  if (this.isWebContext()) {
    return await this.executeAtom('get_window_size', []);
  } else {
    return await this.uiAutoClient.sendCommand("au.getWindowSize()");
  }
};

commands.getStrings = async function (language, stringFile = null) {
  log.debug(`Gettings strings for language '${language}' and string file '${stringFile}'`);
  let strings = await utils.parseLocalizableStrings(_.defaults({language, stringFile}, this.opts));
  if (strings && strings.length >= 1) {
    strings = strings[0];
  }
  return strings;
};

commands.setUrl = async function (url) {
  log.debug(`Attempting to set url '${url}'`);
  if (!this.isWebContext()) {
    // use xcrun to open deeplink
    await openUrl(this.opts.udid || this.sim.udid, url);
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
