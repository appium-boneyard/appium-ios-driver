import logger from '../logger';
import { BaseDriver } from 'appium-base-driver';
import { util } from 'appium-support';

let commands = {}, helpers = {}, extensions = {};

// Arguments will be: [{"protocol":"W3C","implicit":30000}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97", ...]
// eslint-disable-next-line no-unused-vars
commands.timeouts = async function (timeoutsObj) {
  if (timeoutsObj.protocol === BaseDriver.DRIVER_PROTOCOL.W3C) {
    const {script, pageLoad, implicit} = timeoutsObj;
    logger.debug(`script: ${script}, pageLoad: ${pageLoad}, implicit: ${implicit}`);

    if (util.hasValue(script)) {
      this.asyncScriptTimeout(script);
    }

    if (util.hasValue(pageLoad)) {
      this.setPageLoadTimeout(this.parseTimeoutArgument(pageLoad));
    }

    if (util.hasValue(implicit)) {
      this.implicitWait(implicit);
    }
  } else {
    const {type, ms} = timeoutsObj;

    switch (type) {
      case 'command':
        this.newCommandTimeout(ms);
        break;
      case 'implicit':
        this.implicitWait(ms);
        break;
      case 'page load':
        this.setPageLoadTimeout(this.parseTimeoutArgument(ms));
        break;
      case 'script':
        this.asyncScriptTimeout(ms);
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
