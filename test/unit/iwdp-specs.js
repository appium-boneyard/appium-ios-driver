// transpile:mocha

import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import IWDP from '../../lib/iwdp';
import { SubProcess } from 'teen_process';

chai.should();
chai.use(chaiAsPromised);

const { expect } = chai;
let iwdpInstance;

describe('ios webkit debug proxy class', () => {
  beforeEach(async () => {
    iwdpInstance = new IWDP();
  });

  it('should detect that IWDP is supported on this machine', async function () {
    expect(IWDP.isSupported());
  });

  it('should throw an exception if IWDP is unsupported and we attempt to instantiate it', async function() {
    let whichStub = sinon.stub(IWDP, 'isSupported', () => false);
    expect(() => new IWDP()).to.throw(/not supported/);
    whichStub.restore();
  });

  it('should start ios-webkit-debug-proxy and have no connected devices', async function () {
    await iwdpInstance.start();
    let devices = await iwdpInstance.getDevices();
    expect(devices.length).to.equal(0);
    await iwdpInstance.stop();
  });

  it('should stop trying to start IWDP server after failed attempts', async function (done) {
    // Change process to something that won't work
    iwdpInstance.process = new SubProcess('non-existent-command');
    iwdpInstance.on('failure', () => {
      expect(iwdpInstance.getDevices()).to.be.rejected;
      done();
    });
    iwdpInstance.start();
  });

  it('should not start IWDP server if one is already started on the same port', async function(done) {
    // Copy the IWDP process and start it
    let process = {...iwdpInstance.process};

    await process.start(0);
    iwdpInstance.on('failure', async () => {
      done();
    });
    iwdpInstance.start();
  });

  it('should start IWDP server if one is started on a different port', async function() {
    // Start IWDP on it's default port
    let process = new SubProcess('ios_webkit_debug_proxy');
    process.start();
    await iwdpInstance.start();
    let devices = await iwdpInstance.getDevices();
    expect(devices.length).to.equal(0);
    process.stop();
    await iwdpInstance.stop();
  });
});
