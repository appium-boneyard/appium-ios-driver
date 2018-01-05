import { errors, errorFromCode } from 'appium-base-driver';
import _ from 'lodash';
import url from 'url';
import { util } from 'appium-support';
import logger from '../logger';
import { installSSLCert, uninstallSSLCert } from 'appium-ios-simulator';
import { startHttpsServer } from '../server';


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

  // https sites need to reply to an https endpoint, in Safari
  let protocol = 'http:';
  try {
    let currentUrl = url.parse(await this.getUrl());
    if (currentUrl.protocol === 'https:' && this.opts.httpsCallbackPort && this.opts.httpsCallbackAddress) {
      protocol = currentUrl.protocol;
      port = this.opts.httpsCallbackPort;
      address = this.opts.httpsCallbackAddress;
    }
  } catch (ign) {}
  let responseUrl = `${protocol}//${address}:${port}/wd/hub/session/${sessionId}/receive_async_response`;

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
  this.asyncWaitMs = this.asyncWaitMs || 0;
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

helpers.startHttpsAsyncServer = async function () {
  logger.debug('Starting https server for async responses');
  let address = this.opts.callbackAddress || this.opts.address;
  let port = this.opts.callbackPort || this.opts.port;
  let {sslServer, pemCertificate, httpsPort} = await startHttpsServer(port, address);
  this.opts.sslServer = sslServer;
  this.opts.httpsServerCertificate = pemCertificate;
  this.opts.httpsCallbackPort = httpsPort;
  this.opts.httpsCallbackAddress = 'localhost';
  let udid;
  if (this.sim) {
    // ios driver
    udid = this.sim.udid;
  } else {
    // xcuitest driver
    udid = this.opts.udid;
  }
  await installSSLCert(this.opts.httpsServerCertificate, udid);
};

helpers.stopHttpsAsyncServer = async function () {
  logger.debug('Stopping https server for async responses');
  if (this.opts.sslServer) {
    await this.opts.sslServer.close();
  }
  await uninstallSSLCert(this.opts.httpsServerCertificate, this.opts.udid);
};

commands.executeMobile = async function (mobileCommand, opts={}) {
  // we only support mobile: scroll
  if (mobileCommand === 'scroll') {
    await this.mobileScroll(opts);
  } else if (mobileCommand === 'viewportScreenshot') {
    return await this.getViewportScreenshot();
  } else {
    throw new errors.UnknownCommandError('Unknown command, all the mobile commands except scroll have been removed.');
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
