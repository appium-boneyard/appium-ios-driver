// transpile:mocha
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import IWDP from '../../lib/iwdp';
import { SubProcess } from 'teen_process';
import request from 'request-promise';
import Promise from 'bluebird';
chai.should();
chai.use(chaiAsPromised);

const { expect } = chai;
let iwdpInstance;

describe('ios webkit debug proxy class', () => {
  beforeEach(async () => {
    iwdpInstance = new IWDP();
  });

  afterEach(async () => {
    try {
      await iwdpInstance.stop();
    } catch (ign) { }
  });

  it('should detect that IWDP is supported on this machine', function () {
    expect(IWDP.isSupported());
  });

  it('should start IWDP and be able to access the webpage', async function () {
    await iwdpInstance.start();
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html'); 
  });

  it('should start IWDP server if one is started on a different port', async function() {
    let process = new SubProcess('ios_webkit_debug_proxy', ['c', 'null:12345']);
    await process.start();
    await iwdpInstance.start();
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html');
  });

  it('should restart after the process is stopped abruptly', async function() {
    await iwdpInstance.start();
    await iwdpInstance.process.stop();
    await Promise.delay(1000); // Give the process time to start
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html');
  });

  it('should fail after reaching max retries', async function() {
    await iwdpInstance.start();
  });
});
