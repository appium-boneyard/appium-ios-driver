// transpile:mocha

import { IosDriver } from '../lib/driver';
import { rootDir } from '../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mochawait';
import path from 'path';


chai.should();
chai.use(chaiAsPromised);

describe('driver', () => {
  it('should work', async () => {
    let caps = {
      app: path.resolve(rootDir, 'test', 'assets', 'TestApp.app.zip'),
      platformName: 'iOS',
      deviceName: 'iPhone'
    };
    let driver = new IosDriver();
    await driver.createSession(caps);
  });
});

