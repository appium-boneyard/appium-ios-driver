// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { withSandbox } from 'appium-test-support';
import B from 'bluebird';
import xcode from 'appium-xcode';
import { getXcodeVersion } from './helpers';


chai.should();
chai.use(chaiAsPromised);

describe('Early failures', withSandbox({}, (S) => {
  it('should error when Xcode does not support Instruments', async () => {
    S.sandbox.stub(xcode, 'getVersion').returns(getXcodeVersion(8, 0, 0));

    let instruments = new Instruments({});
    let onExitSpy = sinon.spy();
    instruments.onShutdown.then(onExitSpy, onExitSpy).done(); // eslint-disable-line
    await instruments.launch().should.be.rejectedWith(/Instruments-based automation was removed in Xcode 8/);
    onExitSpy.callCount.should.eql(0);
  });

  it('should error when Xcode 5.0.1 is used', async () => {
    S.sandbox.stub(xcode, 'getVersion').returns(getXcodeVersion(5, 0, 1));

    let instruments = new Instruments({});
    let onExitSpy = sinon.spy();
    instruments.onShutdown.then(onExitSpy, onExitSpy).done(); // eslint-disable-line
    await instruments.launch().should.be.rejectedWith(/Xcode 5.0.1 ships with a broken version of Instruments/);
    onExitSpy.callCount.should.eql(0);
  });

  it('should error on getAutomationTraceTemplatePath failure', async () => {
    S.sandbox.stub(xcode, 'getVersion').returns(getXcodeVersion());
    S.sandbox.stub(xcode, 'getAutomationTraceTemplatePath').returns(B.reject(new Error('ouch!')));

    let instruments = new Instruments({});
    let onExitSpy = sinon.spy();
    instruments.onShutdown.then(onExitSpy, onExitSpy).done(); // eslint-disable-line
    await instruments.launch().should.be.rejectedWith(/ouch!/);
    onExitSpy.callCount.should.eql(0);
  });

  it('should error on getInstrumentsPath failure', async () => {
    S.sandbox.stub(xcode, 'getVersion').returns(getXcodeVersion());
    S.sandbox.stub(xcode, 'getAutomationTraceTemplatePath').returns('/path/to/trace/template');

    let instruments = new Instruments({});
    S.sandbox.stub(instrumentsUtils, 'getInstrumentsPath').returns(B.reject(new Error('ouch!')));
    let onExitSpy = sinon.spy();
    instruments.onShutdown.then(onExitSpy, onExitSpy).done(); // eslint-disable-line
    await instruments.launch().should.be.rejectedWith(/ouch!/);
    onExitSpy.callCount.should.eql(0);
  });
}));
