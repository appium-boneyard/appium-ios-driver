// transpile:mocha

import { appUtils } from '../..';
import getAppPath from 'sample-apps';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';


chai.should();
chai.use(chaiAsPromised);

const app = getAppPath('TestApp');

describe('extractAppDisplayName', () => {
  it('should get application name of app', async () => {
    let appName = await appUtils.extractAppDisplayName(app);

    appName.should.equal('TestApp');
  });
});

describe('extractBundleId', () => {
  it('should get bundleId of app', async () => {
    let bundleId = await appUtils.extractBundleId(app);

    bundleId.should.equal('io.appium.TestApp');
  });
});
