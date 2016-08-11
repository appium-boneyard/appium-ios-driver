import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

commands.timeouts = async function (type, duration) {
  let ms = this.parseTimeoutArgument(duration);
  switch (type) {
    case 'command':
      this.setNewCommandTimeout(ms);
      break;
    case 'implicit':
      this.setImplicitWait(ms);
      break;
    case 'page load':
      this.setPageLoadTimeout(ms);
      break;
    case 'script':
      this.setAsyncScriptTimeout(ms);
      break;
    default:
      throw new Error(`Invalid timeout '${type}'`);
  }
};

commands.asyncScriptTimeout = async function (ms) {
  this.setAsyncScriptTimeout(this.parseTimeoutArgument(ms));
};

helpers.setPageLoadTimeout = function (ms) {
  ms = parseInt(ms, 10);
  this.pageLoadMs = ms;
  if (this.remote) {
    this.remote.pageLoadMs = this.pageLoadMs;
  }
  logger.debug(`Set page load timeout to ${ms}ms`);
};

helpers.setAsyncScriptTimeout = function (ms) {
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
