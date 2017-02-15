// transpile:mocha
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import IWDP from '../../lib/iwdp';
import { SubProcess } from 'teen_process';
import request from 'request-promise';

chai.should();
chai.use(chaiAsPromised);

const { expect } = chai;
let iwdpInstance;

describe.only('ios webkit debug proxy class', () => {
  beforeEach(async () => {
    iwdpInstance = new IWDP();
  });

  it('should detect that IWDP is supported on this machine', async function () {
    expect(IWDP.isSupported());
  });

  it('should start ios-webkit-debug-proxy and get list of 0 or more devices', async function () {
    await iwdpInstance.start();
    request(iwdpInstance.endpoint).should.eventually.have.string('<html');
    await iwdpInstance.stop();
  });

  it('should start IWDP server if one is started on a different port', async function() {
    // Start IWDP on it's default port
    let process = new SubProcess('ios_webkit_debug_proxy');
    process.start();
    await iwdpInstance.start();
    request(iwdpInstance.endpoint).should.eventually.have.string('<html');
    await iwdpInstance.stop();
  });
});
