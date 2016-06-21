import { errors, errorFromCode } from 'appium-base-driver';
import _ from 'lodash';
import url from 'url';
import { util } from 'appium-support';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

commands.execute = async function (script, args) {
  if (script.match(/^mobile\:/)) {
    script = script.replace(/^mobile\:/, '').trim();
    return await this.executeMobile(script, _.isArray(args) ? args[0] : args);
  } else {
    if (this.isWebContext()) {
      args = this.convertElementsForAtoms(args);
      return await this.executeAtom('execute_script', [script, args]);
    } else {
      return await this.uiAutoClient.sendCommand(script);
    }
  }
};

commands.executeAsync = async function (script, args, sessionId) {
  if (!this.isWebContext()) {
    return await this.uiAutoClient.sendCommand(script);
  }

  let address = this.opts.callbackAddress || this.opts.address;
  let port = this.opts.callbackPort || this.opts.port;
  sessionId = sessionId || this.sessionId;
  let responseUrl = `http://${address}:${port}/wd/hub/session/${sessionId}/receive_async_response`;

  if (this.isRealDevice()) {
    let defaultHost = this.opts.address;
    let urlObject = url.parse(responseUrl);
    if (urlObject.hostname === defaultHost) {
      logger.debug('Real device safari test and no custom callback address ' +
                   'set, changing callback address to local ip.');
      urlObject.hostname = util.localIp();
      urlObject.host = null; // set to null, otherwise hostname is ignored
      responseUrl = url.format(urlObject);
    } else {
      logger.debug('Custom callback address set, leaving as is.');
    }
  }

  logger.debug(`Response url for executeAsync: ${responseUrl}`);
  args = this.convertElementsForAtoms(args);
  return await this.executeAtomAsync('execute_async_script', [script, args, this.asyncWaitMs], responseUrl);
};

commands.receiveAsyncResponse = async function (status, value) {
  logger.debug(`Received async response: ${JSON.stringify(value)}`);
  if (!_.isNull(this.asyncPromise) && !_.isUndefined(this.asyncPromise)) {
    if (status !== 0) {
      this.asyncPromise.reject(errorFromCode(status, value.message));
    } else {
      this.asyncPromise.resolve(value);
    }
  } else {
    logger.warn(`Received async response when we were not expecting one! ` +
                `Response was: ${JSON.stringify(value)}`);
  }
};

commands.executeMobile = async function (mobileCommand, opts={}) {
  // we only support mobile: scroll
  if (mobileCommand === 'scroll') {
    await this.mobileScroll(opts);
  } else {
    throw new errors.UnknownCommandError('Unknown command, all the mobile commands except scroll have been removed.');
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
