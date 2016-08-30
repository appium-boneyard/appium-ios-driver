import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

commands.getOrientation = async function () {
  try {
    let res = await this.uiAutoClient.sendCommand('au.getScreenOrientation()');
    // keep track of orientation for our own purposes
    logger.debug(`Setting internal orientation to '${res}'`);
    this.opts.curOrientation = res;
    return res;
  } catch (err) {
    logger.error(`Device orientation is not supported.`);
    throw err;
  }
};

commands.setOrientation = async function (orientation) {
  orientation = orientation.toUpperCase();
  let cmd = `au.setScreenOrientation('${orientation}')`;
  try {
    let res = await this.uiAutoClient.sendCommand(cmd);
    this.opts.curOrientation = orientation;
    return res;
  } catch (err) {
    logger.error(`Device orientation ${orientation} is not supported on this device.`);
    throw err;
  }
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
