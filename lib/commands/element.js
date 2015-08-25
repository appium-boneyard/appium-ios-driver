import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import { util } from 'appium-support';

let commands = {}, helpers = {}, extensions = {};

commands.getAttribute = async function (attribute, elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (_.contains(['label', 'name', 'value', 'values', 'hint'], attribute)) {
      let command = `au.getElement('${elementId}').${attribute}()`;
      return await this.uiAutoClient.sendCommand(command);
    } else {
      throw new errors.UnknownCommandError(`UIAElements don't have the attribute '${attribute}'`);
    }
  }
};

commands.clear = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').setValue('')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.setValueImmediate = async function (value, elementId) {
  value = util.escapeSpecialChars(value, "'");
  let command = `au.getElement('${elementId}').setValue('${value}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.setValue = async function (value, elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (value instanceof Array) {
      value = value.join("");
    }
    value = util.escapeSpecialChars(value, "'");
    // de-escape \n so it can be used specially
    value = value.replace(/\\\\n/g, "\\n");
    if (this.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      let command = `au.getElement('${elementId}').setValueByType('${value}')`;
      await this.uiAutoClient.sendCommand(command);
    }
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

commands.getText = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').text()`;
    let res = await this.uiAutoClient.sendCommand(command);
    // in some cases instruments returns in integer. we only want a string
    res= res ? res.toString() : '';
    return res;
  }
};

commands.elementDisplayed = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').isDisplayed()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementEnabled = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').isEnabled() === 1`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementSelected = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').isSelected()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getName = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').type()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getLocation = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').getElementLocation()`;
    return await this.uiAutoClient.sendCommand(command);
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

commands.getSize = async function (elementId) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${elementId}').getElementSize()`;
    return await this.uiAutoClient.sendCommand(command);
  }
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
