import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

commands.getOrientation = async function () {
  let res = await this.uiAutoClient.sendCommand('au.getScreenOrientation()');
  if (res && res.status === 0) {
    // keep track of orientation for our own purposes
    let orientation = res.value.toUpperCase();
    logger.debug(`Setting internal orientation to '${orientation}'`);
    this.opts.curOrientation = orientation;
  }
  return res;
};

commands.setOrientation = async function (orientation) {
  orientation = orientation.toUpperCase();
  let cmd = `au.setScreenOrientation('${orientation}')`;
  let res = await this.uiAutoClient.sendCommand(cmd);
  if (res && res.status === 0) {
    this.opts.curOrientation = orientation;
  }
  return res;
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
