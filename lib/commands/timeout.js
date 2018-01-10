import logger from '../logger';
import { BaseDriver } from 'appium-base-driver';


let commands = {}, helpers = {}, extensions = {};

// Arguments will be: [{"protocol":"W3C","implicit":30000}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97", ...]
// eslint-disable-next-line no-unused-vars
commands.timeouts = async function (timeoutsObj, ...args) {
  if (timeoutsObj.protocol === BaseDriver.DRIVER_PROTOCOL.W3C) {
      // TODO: for W3C
  } else {
    const {type, ms} = timeoutsObj;

    let duration = this.parseTimeoutArgument(ms);
    switch (type) {
      case 'command':
        this.setNewCommandTimeout(duration);
        break;
      case 'implicit':
        this.setImplicitWait(duration);
        break;
      case 'page load':
        this.setPageLoadTimeout(duration);
        break;
      case 'script':
        this.setAsyncScriptTimeout(duration);
        break;
      default:
        throw new Error(`Invalid timeout '${type}'`);
    }
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
