import logger from '../logger';

let commands = {}, helpers = {}, extensions = {};

// pageLoad
commands.pageLoadTimeoutW3C = async function (ms) {
  await this.setPageLoadTimeout(this.parseTimeoutArgument(ms));
};

commands.pageLoadTimeoutMJSONWP = async function (ms) {
  await this.setPageLoadTimeout(this.parseTimeoutArgument(ms));
};

// script
commands.scriptTimeoutW3C = async function (ms) {
  await this.asyncScriptTimeout(ms);
};

commands.scriptTimeoutMJSONWP = async function (ms) {
  await this.asyncScriptTimeout(ms);
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

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
