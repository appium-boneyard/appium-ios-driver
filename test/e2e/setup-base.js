
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import { server as baseServer, routeConfiguringFunction } from 'appium-base-driver';
import _ from 'lodash';
import log from '../../lib/logger';
import './helpers/setup_testlibs';


let server;

async function startServer (session) {
  // start the server before start the session, so startup can use it if necessary
  let router = routeConfiguringFunction(session.rawDriver);
  server = await baseServer(router, env.APPIUM_PORT, 'localhost');
  log.info(`IosDriver server listening on http://localhost:${env.APPIUM_PORT}`);
}

function setup (context, desired, opts = {}, envOverrides = false, needsNewServer = false) {
  context.timeout(env.MOCHA_INIT_TIMEOUT);
  let newEnv = _.clone(env);
  if (envOverrides) {
    _.extend(newEnv, envOverrides);
  }

  if (!opts.port) {
    opts.port = env.APPIUM_PORT;
  }

  opts.callbackAddress = 'localhost';

  let session = new Session(desired, opts);
  let allPassed = true;

  before(async () => {
    if (!server) {
      await startServer(session);
    } else if (needsNewServer) {
      await server.close();
      await startServer(session);
    }
    await session.setUp(getTitle(context));
  });

  after(async () => {
    await session.tearDown(allPassed);
    if (needsNewServer) {
      await server.close();
    }
  });

  afterEach(function () {
    allPassed = allPassed && this.currentTest.state === 'passed';
  });

  return session;
}

export default setup;
