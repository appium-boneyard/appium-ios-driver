import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import js2xml from "js2xmlparser2";
import log from '../logger';

let commands = {}, helpers = {}, extensions = {};

commands.active = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    return await this.uiAutoClient.sendCommand("au.getActiveElement()");
  }
};

commands.hideKeyboard = async function (strategy, ...possibleKeys) {
  possibleKeys.pop(); // last parameter is the session id
  let cmd;
  let key = _.find(possibleKeys ,(k) => {return k;});
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
    /* TODO */throw new errors.NotYetImplementedError();
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

commands.back = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    await this.uiAutoClient.sendCommand("au.back()");
  }
};

commands.background = async function (secs) {
  // not using au.background(${secs}) because it buggy, deactivateAppForDuration
  // may not work the first time
  // TODO: fix au.background in uiauto
  await this.uiAutoClient.sendCommand(
    `var x = target.deactivateAppForDuration(${secs}); var MAX_RETRY=5, retry_count = 0; ` +
    `while (!x && retry_count < MAX_RETRY) { x = target.deactivateAppForDuration(${secs}); ` +
    `retry_count += 1}; x`);
};

commands.getLocationInView = async function (element) {
  return await this.getLocation(element);
};

commands.lock = async function (secs) {
  await this.uiAutoClient.sendCommand(`au.lock(${secs})`);
};

commands.closeApp = async function () {
  try {
    await this.stop();
    log.info(`Successfully closed the [${this.opts.app}] app.`);
  } catch (err) {
    log.warn(`Something went wrong whilst closing the [${this.opts.app}] app.`);
    throw err;
  }
};

commands.launchApp = async function () {
  try {
    await this.start();
    log.info(`Successfully launched the [${this.opts.app}] app.`);
  } catch(err) {
    log.warn(`Something went wrong whilst launching the [${this.opts.app}] app.`);
    throw err;
  }
};

commands.keys = async function (keys) {
  // TODO: should not be needed -> keys = util.escapeSpecialChars(keys, "'");
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
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
    await this.uiAutoClient.sendCommand(
      `target.setLocation(${JSON.stringify(location)})`);
  //}
};

commands.getWindowSize = async function (windowHandle) {
  if (windowHandle !== "current") {
    throw new errors.NotYetImplementedError("Currently only getting current window size is supported.");
  }

  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    return await this.uiAutoClient.sendCommand("au.getWindowSize()");
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
