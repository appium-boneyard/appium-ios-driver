// transpile:mocha

import env from '../helpers/env';
import { rootDir } from '../../../lib/utils';
import path from 'path';
import { IosDriver } from '../../..';
import { SUPPORTED_LOG_TYPES } from '../../../lib/commands/logging.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';
import { MOCHA_TIMEOUT } from '../helpers/session';


chai.should();
chai.use(chaiAsPromised);

describe('commands - logging', function () {
  this.timeout(MOCHA_TIMEOUT);
  let driver;

  before(() => {
    driver = new IosDriver();
  });

  describe('getLogTypes', () => {
    it('should get the list of available logs', async () => {
      driver.getLogTypes.should.be.a.Function;
      (await driver.getLogTypes()).should.eql(_.keys(SUPPORTED_LOG_TYPES));
    });
  });

  describe('getLog', () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
      showIOSLog: true,
      noReset: true,
      newCommandTimeout: 120
    };
    caps = _.merge({}, env.CAPS, caps);

    describe('errors', () => {
      it('should throw an error when an invalid type is given', async () => {
        await driver.getLog('something-random').should.eventually.be.rejected;
      });
      it('should throw an error when driver is not started', async () => {
        await driver.getLog('syslog').should.eventually.be.rejected;
      });
    });

    describe('success', () => {
      before(async function () {
        // TODO: figure out why this is so flakey in Travis
        if (process.env.TRAVIS) this.skip();
        await driver.createSession(caps);
      });
      after(async () => {
        await driver.deleteSession();
      });
      it('should get system logs', async () => {
        (await driver.getLog('syslog')).should.be.an.Array;
      });
      it('should get crash logs', async () => {
        (await driver.getLog('crashlog')).should.be.an.Array;
      });
    });
  });
});
