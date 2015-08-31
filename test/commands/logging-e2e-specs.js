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

describe.only('commands - logging', function () {
  this.timeout(120000);
  let driver;

  beforeEach(() => {
    driver = new IosDriver();
  });

  afterEach(() => {
    // deleting a non-existent session does not have any effect
    driver.deleteSession();
  });

  describe('getLogTypes', () => {
    it('should get the list of available logs', () => {
      driver.getLogTypes.should.be.a.Function;
      driver.getLogTypes().should.eql(_.keys(SUPPORTED_LOG_TYPES));
    });
  });

  describe('getLog', () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
      deviceName: 'iPhone 5',
      showIOSLog: true
    };

    it('should throw an error when an invalid type is given', () => {
      (() => {driver.getLog('something-random');}).should.throw;
    });
    it('should throw an error when driver is not started', () => {
      (() => {driver.getLog('syslog');}).should.throw;
    });
    it('should get system logs', async () => {
      await driver.createSession(caps);
      driver.getLog('syslog').should.be.an.Array;
    });
    it('should get crash logs', async () => {
      await driver.createSession(caps);
      driver.getLog('crashlog').should.be.an.Array;
    });
  });
});

