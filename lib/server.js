import log from './logger';
import { default as baseServer } from 'appium-express';
import { routeConfiguringFunction } from 'mobile-json-wire-protocol';
import { IosDriver } from './driver';

async function startServer (port, host) {
  let driver = new IosDriver();
  let router = routeConfiguringFunction(driver);
  let server = baseServer(router, port, host);
  log.info(`IosDriver server listening on http://${host}:${port}`);
  return server;
}

export { startServer };
