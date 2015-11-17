"use strict";
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import { default as baseServer } from 'appium-express';
import { routeConfiguringFunction } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import { getTemplate } from 'appium-express/build/lib/static';
import log from '../../lib/logger';
import './helpers/setup_testlibs';

const NOOP = () => {};

function setup (context, desired, opts = {}, envOverrides) {
  context.timeout(env.MOCHA_INIT_TIMEOUT);
  let newEnv = _.clone(env);
  if (envOverrides) {
    _.extend(newEnv, envOverrides);
  }

  if (!opts.port) {
    opts.port = env.APPIUM_PORT;
  }

  let session = new Session(desired, opts);
  let allPassed = true;

  let router = routeConfiguringFunction(session.rawDriver);
  let server = baseServer(router, env.APPIUM_PORT, 'localhost');
  log.info(`IosDriver server listening on http://localhost:${env.APPIUM_PORT}`);

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
