import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
//import { util } from 'appium-support';

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
  let key = _.find(possibleKeys ,(k) => {return k;});
  strategy = strategy || 'pressKey';
  let cmd = `au.hideKeyboard('${strategy}'`;
  cmd = key ? `${cmd}, '${key}')` : `${cmd})`;
  await this.uiAutoClient.sendCommand(cmd);
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
