// transpile:mocha

import { appUtils } from '../..';
import { absolute } from 'ios-test-app';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);


describe('extractAppDisplayName', () => {
  it('should get application name of app', async () => {

    let app = absolute.iphonesimulator;
    let appName = await appUtils.extractAppDisplayName(app);

    appName.should.equal('TestApp');
  });
});

describe('extractBundleId', () => {
  it('should get bundleId of app', async () => {
    let app = absolute.iphonesimulator;
    let bundleId = await appUtils.extractBundleId(app);

    bundleId.should.equal('io.appium.TestApp');
  });
});
