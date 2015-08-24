import { errors } from 'mobile-json-wire-protocol';
let commands = {}, helpers = {}, extensions = {};

commands.nativeTap = async function (elementId) {
  var command = `au.tapById('${elementId}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.click = function (elementId, cb) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (this.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      this.nativeTap(elementId, cb);
    }
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
