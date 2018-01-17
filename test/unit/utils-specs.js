// transpile:mocha

import * as utils from '../../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

describe('prepareIosOpts', function () {
  it('should use instruments without delay by default', async function () {
    let opts = {};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should use instruments without delay if explicitly not using native instruments', async function () {
    let opts = {nativeInstrumentsLib: false};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should not use instruments without delay if using native intruments', async function () {
    let opts = {nativeInstrumentsLib: true};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.false;
  });
});
