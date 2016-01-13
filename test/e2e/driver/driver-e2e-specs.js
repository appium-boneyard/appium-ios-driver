// transpile:mocha

import _ from 'lodash';
import env from '../helpers/env';
import { IosDriver } from '../../../lib/driver';
import { rootDir } from '../../../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import B from 'bluebird';

chai.should();
chai.use(chaiAsPromised);

describe('driver', function () {
  this.timeout(120000);
  let driver;
  it('should start', async () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
    };
    caps = _.merge({}, env.CAPS, caps);
    driver = new IosDriver();
    await driver.createSession(caps);
  });

  it('should stop', async () => {
    await B.delay(2000);
    await driver.deleteSession();
  });
});

describe.only('getDeviceTime',function(){
  it('should get device time', async () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
      deviceName: 'iPhone 5'
    };
    let driver = new IosDriver();
    await driver.createSession(caps);
    await driver.getDeviceTime().should.be.a.Date;
    await driver.deleteSession();
  });
});

