import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import { util } from 'appium-support';
import { unwrapEl } from '../utils';

let commands = {}, helpers = {}, extensions = {};

commands.getAttribute = async function (attribute, el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (_.contains(['label', 'name', 'value', 'values', 'hint'], attribute)) {
      let command = `au.getElement('${el}').${attribute}()`;
      return await this.uiAutoClient.sendCommand(command);
    } else {
      throw new errors.UnknownCommandError(`UIAElements don't have the attribute '${attribute}'`);
    }
  }
};

commands.clear = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').setValue('')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.setValueImmediate = async function (value, el) {
  el = unwrapEl(el);
  value = util.escapeSpecialChars(value, "'");
  let command = `au.getElement('${el}').setValue('${value}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.setValue = async function (value, el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (value instanceof Array) {
      value = value.join("");
    }
    value = util.escapeSpecialChars(value, "'");
    // de-escape \n so it can be used specially
    value = value.replace(/\\\\n/g, "\\n");
    if (this.opts.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      let command = `au.getElement('${el}').setValueByType('${value}')`;
      await this.uiAutoClient.sendCommand(command);
    }
  }
};

commands.getText = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').text()`;
    let res = await this.uiAutoClient.sendCommand(command);
    // in some cases instruments returns in integer. we only want a string
    res= res ? res.toString() : '';
    return res;
  }
};

commands.elementDisplayed = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').isDisplayed()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementEnabled = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').isEnabled() === 1`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementSelected = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').isSelected()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getName = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').type()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getLocation = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').getElementLocation()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getSize = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let command = `au.getElement('${el}').getElementSize()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
