// transpile:mocha

import env from '../helpers/env';
import { rootDir } from '../../../lib/utils';
import path from 'path';
import { IosDriver } from '../../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';
import { MOCHA_TIMEOUT } from '../helpers/session';


chai.should();
chai.use(chaiAsPromised);

describe('commands - logging', function () {
  this.timeout(MOCHA_TIMEOUT);
  let driver;

  before(function () {
    driver = new IosDriver();
  });

  describe('getLogTypes', function () {
    it('should get the list of available logs', async function () {
      driver.getLogTypes.should.an.instanceof(Function);
      (await driver.getLogTypes()).should.eql(_.keys(driver.supportedLogTypes));
    });
  });

  describe('getLog', function () {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
      showIOSLog: true,
      noReset: true,
      newCommandTimeout: 120
    };
    caps = _.merge({}, env.CAPS, caps);

    describe('errors', function () {
      it('should throw an error when an invalid type is given', async function () {
        await driver.getLog('something-random').should.eventually.be.rejected;
      });
      it('should throw an error when driver is not started', async function () {
        await driver.getLog('syslog').should.eventually.be.rejected;
      });
    });

    describe('success', function () {
      before(async function () {
        // TODO: figure out why this is so flakey in Travis
        if (process.env.TRAVIS) this.skip(); // eslint-disable-line curly
        await driver.createSession(caps);
      });
      after(async function () {
        await driver.deleteSession();
      });
      it('should get system logs', async function () {
        (await driver.getLog('syslog')).should.be.an.instanceof(Array);
      });
      it('should get crash logs', async function () {
        (await driver.getLog('crashlog')).should.be.an.instanceof(Array);
      });
    });
  });
});
