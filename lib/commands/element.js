import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';

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
    var command = `au.getElement('${elementId}').setValue('')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
