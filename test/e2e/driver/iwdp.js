// transpile:mocha
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import IWDP from '../../../lib/iwdp';
import { SubProcess } from 'teen_process';
import request from 'request-promise';
import B from 'bluebird';
chai.should();
chai.use(chaiAsPromised);

const { expect } = chai;
let iwdpInstance;

describe('ios webkit debug proxy class', function () {
  this.timeout(20000);

  beforeEach(async () => {
    iwdpInstance = new IWDP();
  });

  afterEach(async () => {
    try {
      await iwdpInstance.stop();
    } catch (ign) { }
  });

  it('should reject calls to http://localhost:27753; if this test fails, IWDP is already being run on port 27753', async function () {
    await request(iwdpInstance.endpoint).should.be.rejected;
  });

  it('should detect that IWDP is supported on this machine', async function () {
    await iwdpInstance.isSupported().should.eventually.be.true;
  });

  it('should start IWDP and be able to access the main page', async function () {
    await iwdpInstance.start();
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html');
  });

  it('should not keep running after stop is called', async function () {
    await iwdpInstance.start();
    await iwdpInstance.stop();
    await request(iwdpInstance.endpoint).should.be.rejected;
  });

  it('should still start IWDP server if one is started on a different port', async function () {
    let process = new SubProcess('ios_webkit_debug_proxy', ['--config', 'null:56789']);
    process.start();
    await B.delay(500);
    await request('http://localhost:56789/').should.eventually.have.string('<html');
    await iwdpInstance.start();
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html');
    await process.stop();
  });

  it('should restart after the process is stopped abruptly', async function () {
    await iwdpInstance.start();
    await iwdpInstance.process.stop();
    await new B((resolve) => {
      iwdpInstance.once('start', resolve);
    });
    await request(iwdpInstance.endpoint).should.eventually.have.string('<html');
  });

  it('should fail after reaching max retries', async ()  => {
    await iwdpInstance.start();
    let retries = 0;

    // It should give up restarting after 10 failed attempts
    let errorPromise = new B((resolve) => {
      iwdpInstance.on('error', () => {
        expect(retries).to.equal(10);
        resolve();
      });
    });

    // Keep stopping the process after it has been started
    while (++retries <= 10) {
      let promise = new B((resolve) => {
        iwdpInstance.once('start', () => {
          resolve();
        });
      });
      await iwdpInstance.process.stop();
      if (retries < 10) {
        await promise;
      }
    }

    await errorPromise;
  });
});
