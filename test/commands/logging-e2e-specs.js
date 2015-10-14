// transpile:mocha

import { IosDriver } from '../../..';
import { rootDir } from '../../lib/utils';
import { SUPPORTED_LOG_TYPES } from '../../lib/commands/logging.js';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import _ from 'lodash';


chai.should();
chai.use(chaiAsPromised);

describe('commands - logging', function () {
  this.timeout(120000);
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
      deviceName: 'iPhone 6',
      showIOSLog: true
    };

    describe('errors', () => {
      it('should throw an error when an invalid type is given', async () => {
        (async () => await driver.getLog('something-random')).should.throw;
      });
      it('should throw an error when driver is not started', async () => {
        (async () => await driver.getLog('syslog')).should.throw;
      });
    });
    describe('success', () => {
      before(async () => {
        // these tests don't need to be isolated, so use one session
        await driver.createSession(caps);
      });
      after(async () => {
        await driver.deleteSession();
      });
      it('should get system logs', async () => {
        // await driver.createSession(caps);
        (await driver.getLog('syslog')).should.be.an.Array;
      });
      it('should get crash logs', async () => {
        // await driver.createSession(caps);
        (await driver.getLog('crashlog')).should.be.an.Array;
      });
    });
  });
});

