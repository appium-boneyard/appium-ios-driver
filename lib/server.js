import log from './logger';
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver';
import { IosDriver } from './driver';

async function startServer (port, host) {
  let driver = new IosDriver();
  let router = routeConfiguringFunction(driver);
  let server = baseServer(router, port, host);
  log.info(`IosDriver server listening on http://${host}:${port}`);
  return server;
}

export { startServer };
