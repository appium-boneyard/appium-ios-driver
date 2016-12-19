// transpile:mocha

import * as utils from '../../lib/utils';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

describe('prepareIosOpts', () => {
  it('should use instruments without delay by default', async () => {
    let opts = {};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should use instruments without delay if explicitly not using native instruments', async () => {
    let opts = {nativeInstrumentsLib: false};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.true;
  });
  it('should not use instruments without delay if using native intruments', async () => {
    let opts = {nativeInstrumentsLib: true};
    utils.prepareIosOpts(opts);
    opts.withoutDelay.should.be.false;
  });
});
