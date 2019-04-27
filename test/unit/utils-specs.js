import * as utils from '../../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks } from 'appium-test-support';
import xcode from 'appium-xcode';


chai.should();
chai.use(chaiAsPromised);

describe('prepareIosOpts', withMocks({xcode}, (mocks) => {
  beforeEach(function () {
    mocks.xcode.expects('getMaxIOSSDK')
      .once().returns('9.3');
  });
  afterEach(function () {
    mocks.verify();
  });
  it('should use instruments without delay by default', async function () {
    const opts = {};
    await utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should use instruments without delay if explicitly not using native instruments', async function () {
    const opts = {nativeInstrumentsLib: false};
    await utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should not use instruments without delay if using native intruments', async function () {
    const opts = {nativeInstrumentsLib: true};
    await utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.false;
  });
}));
