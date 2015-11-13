
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import server from 'appium-express';
import _ from 'lodash';
import './helpers/setup_testlibs';

const NOOP = () => {};
const DEFAULT_OPTS = { port: env.APPIUM_PORT };

function setup (context, desired, opts = DEFAULT_OPTS, envOverrides) {
  context.timeout(env.MOCHA_INIT_TIMEOUT);
  let newEnv = _.clone(env);
  if (envOverrides) {
    _.extend(newEnv, envOverrides);
  }

  let session = new Session(desired, opts);
  let allPassed = true;

  before(async () => {
    /**
     * start server
     */
    if (!context.server) {
      context.server = await server(NOOP, env.APPIUM_PORT, 'localhost');
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

export default setup;
