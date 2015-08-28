import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';

let commands = {}, helpers = {}, extensions = {};

commands.execute = async function (script, args) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if(script.match(/^mobile\:/)) {
      script = script.replace(/^mobile\:/, '').trim();
      await this.executeMobile(script, _.isArray(args) ? args[0] : args);
    } else {
      try {
        let res = await this.uiAutoClient.sendCommand(script);
        return res;
      } catch (err) {
        throw err;
      }
    }
  }
};

commands.executeMobile = async function (mobileCommand, opts={}) {
  // we only support mobile: scroll
  if (mobileCommand === 'scroll') {
    await this.mobileScroll(opts);
  } else {
    // TODO: check that this still apply
    throw new errors.UnknownCommandError('Unknown command, all the mobile commands except scroll have been removed.');
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
