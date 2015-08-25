import { errors } from 'mobile-json-wire-protocol';
let commands = {}, helpers = {}, extensions = {};

commands.nativeTap = async function (elementId) {
  let command = `au.tapById('${elementId}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.click = async function (elementId, cb) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (this.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      await this.nativeTap(elementId, cb);
    }
  }
};

commands.mobileRotation = async function (...args) {
  args.pop(); //pops sessionId
  let [x, y, radius, rotation, touchCount, duration, elId] = args;
  let location = {'x' : x, 'y' : y};
  let options = {'duration' : duration, 'radius' : radius, 'rotation' : rotation, 'touchCount' : touchCount};
  if (elId) {
    if (this.isWebContext()) {
      throw new errors.NotYetImplementedError();
    }
    await this.uiAutoClient.sendCommand(
      `au.getElement('${elId}').rotateWithOptions(${JSON.stringify(location)},${JSON.stringify(options)})`);
  } else {
    await this.uiAutoClient.sendCommand(
      `target.rotateWithOptions(${JSON.stringify(location)}, ${JSON.stringify(options)})`);
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
