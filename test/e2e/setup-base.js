
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import { default as baseServer } from 'appium-express';
import { routeConfiguringFunction } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import log from '../../lib/logger';
import './helpers/setup_testlibs';


let serverStarted = false;

function globalSetup (session) {
  // we only want to do this once
  if (!serverStarted) {
    let router = routeConfiguringFunction(session.rawDriver);
    baseServer(router, env.APPIUM_PORT, 'localhost');
    log.info(`IosDriver server listening on http://localhost:${env.APPIUM_PORT}`);
    serverStarted = true;
  }
}

function setup (context, desired, opts = {}, envOverrides = false) {
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

  globalSetup(session);

  before(async () => {
    await session.setUp(getTitle(context));
  });

  after(async () => {
    await session.tearDown(allPassed);
  });

  afterEach(function () {
    allPassed = allPassed && this.currentTest.state === 'passed';
  });

  return session;
}

export default setup;
