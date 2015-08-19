// transpile:mocha

import { IosDriver } from '../lib/driver';
import { rootDir } from '../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
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
      deviceName: 'iPhone 5'
    };
    driver = new IosDriver();
    await driver.createSession(caps);
  });

  it('should stop', async () => {
    await B.delay(2000);
    await driver.deleteSession();
  });

  after(function() {
    // TODO: something is hanging, need to figure out what.
    process.exit(0);
  });

});

