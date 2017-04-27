// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { withSandbox } from 'appium-test-support';
import B from 'bluebird';


chai.should();
chai.use(chaiAsPromised);

describe('Early failures', withSandbox({}, (S) => {
  it('should error on getInstrumentsPath failure', async () => {
    let instruments = new Instruments({});
    S.sandbox.stub(instrumentsUtils, 'getInstrumentsPath').returns(B.reject(new Error('ouch!')));
    let onExitSpy = sinon.spy();
    instruments.onShutdown.then(onExitSpy, onExitSpy).done(); // eslint-disable-line
    await instruments.launch().should.be.rejectedWith(/ouch!/);
    onExitSpy.should.not.have.been.called;
  });
}));
