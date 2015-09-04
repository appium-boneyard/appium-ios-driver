"use strict";
import env from './helpers/env';
import { Session } from './helpers/session';
import { getTitle } from './helpers/title';
import _ from 'lodash';
import '../helpers/setup_testlibs';

function setup (context, desired, opts, envOverrides) {
  context.timeout(env.MOCHA_INIT_TIMEOUT);
  let newEnv = _.clone(env);
  if (envOverrides) {
    _.extend(newEnv, envOverrides);
  }

  let session = new Session(desired, opts);

  let allPassed = true;

  before(async () => {
    await session.setUp(getTitle(context));
  });

  after(async () => {
    await session.tearDown(allPassed); });

  afterEach(function () {
    allPassed = allPassed && this.currentTest.state === 'passed';
  });

  return session;
}

export default setup;
