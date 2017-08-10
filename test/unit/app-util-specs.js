// transpile:mocha

import { appUtils } from '../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';


chai.should();
chai.use(chaiAsPromised);

// this happens a single time, at load-time for the test suite,
// so sync method is not overly problematic
let app = __filename.indexOf('build/test/unit/app-util-specs') !== -1 ?
  path.resolve(__dirname, '..', '..', '..', 'test', 'assets', 'UICatalog.app') :
  path.resolve(__dirname, '..', '..', 'test', 'assets', 'UICatalog.app');

describe('extractAppDisplayName', () => {
  it('should get application name of app', async () => {
    let appName = await appUtils.extractAppDisplayName(app);

    appName.should.equal('UICatalog');
  });
});

describe('extractBundleId', () => {
  it('should get bundleId of app', async () => {
    let bundleId = await appUtils.extractBundleId(app);

    bundleId.should.equal('com.example.apple-samplecode.UICatalog');
  });
});
