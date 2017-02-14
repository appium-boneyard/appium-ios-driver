import { desiredCapValidation } from '../../lib/desired-caps';
import IWDP from '../../lib/iwdp';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { defaultServerCaps } from '../../lib/driver';
import sinon from 'sinon';

chai.should();
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('validating desired IWDP desired capabilities', () => {
  let desiredCaps;

  beforeEach(() => {
    desiredCaps = Object.assign(defaultServerCaps);
    desiredCaps.startIWDP = true;
    desiredCaps.app = '/path/to/fake/app';
  });

  it('should not throw an error if iwdp is used and iwdp is present on machine', () => {
    desiredCapValidation(desiredCaps).should.be.true;
  });

  it('should throw an error if iwdp is used but iwdp is not available ', () => {
    sinon.stub(IWDP, 'isSupported').returns(false);
    expect(() => desiredCapValidation(desiredCaps)).to.throw(/not installed/);
    IWDP.isSupported.restore();
  });
});