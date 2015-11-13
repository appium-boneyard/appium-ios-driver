"use strict";
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import server from 'appium-express';
import _ from 'lodash';
import { getTemplate } from 'appium-express/build/lib/static';
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

  before(async () => {
    /**
     * start server
     */
    if (!context.server) {
      context.server = await server(setupRoutes, env.APPIUM_PORT, 'localhost');
    }

    await session.setUp(getTitle(context));
  });

  after(async () => {
    await session.tearDown(allPassed);
    await new Promise((resolve) => context.server.close(resolve));
  });

  afterEach(function () {
    allPassed = allPassed && this.currentTest.state === 'passed';
  });

  return session;
}

function setupRoutes(app) {
  app.get('/test/touch.html', (req, res) => {
    res.header['content-type'] = 'text/html';
    res.send(getTemplate('touch.html')());
  });
  app.get('/test/frameset.html', (req, res) => {
    res.header['content-type'] = 'text/html';
    res.send(getTemplate('frameset.html')());
  });
}

export default setup;
