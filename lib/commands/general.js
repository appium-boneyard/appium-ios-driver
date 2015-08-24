import { errors } from 'mobile-json-wire-protocol';
//import _ from 'lodash';
//import { util } from 'appium-support';

let commands = {}, helpers = {}, extensions = {};

commands.active = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    return await this.uiAutoClient.sendCommand("au.getActiveElement()");
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
