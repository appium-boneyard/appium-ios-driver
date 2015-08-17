// transpile:mocha

import { IosDriver } from '../lib/driver';
import { rootDir } from '../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import path from 'path';


chai.should();
chai.use(chaiAsPromised);

describe('driver', function () {
  this.timeout(60000);
  it('should work', async () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.zip'),
      platformName: 'iOS',
      deviceName: 'iPhone 6'
    };
    let driver = new IosDriver();
    await driver.createSession(caps);
  });
});

