import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

commands.timeouts = async function (type, duration) {
  let ms = parseInt(duration, 10);
  switch(type) {
    case 'command':
      this.newCommandTimeout(ms);
      break;
    case 'implicit':
      await this.implicitWait(ms);
      break;
    case 'page load':
      this.pageLoadTimeout(ms);
      break;
    case 'script':
      await this.asyncScriptTimeout(ms);
      break;
    default:
      throw new Error(`Invalid timeout '${type}'`);
  }
};

helpers.pageLoadTimeout = function (ms) {
  ms = parseInt(ms, 10);
  this.pageLoadMs = ms;
  logger.debug(`Set page load timeout to ${ms}ms`);
};

commands.asyncScriptTimeout = async function (ms) {
  this.asyncWaitMs = ms;
  logger.debug(`Set async script timeout to ${ms}ms`);
};


helpers.pageLoadTimeout = function (ms) {
  this.pageLoadMs = ms;

  if (this.remote) {
    this.remote.pageLoadMs = ms;
  }
  logger.debug(`Set page load timeout to ${ms}ms`);
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
