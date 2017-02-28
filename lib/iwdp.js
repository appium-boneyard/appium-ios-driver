import { SubProcess } from 'teen_process';
import EventEmitter from 'events';
import { execSync } from 'child_process';
import Promise from 'bluebird';
import logger from './logger';

const request = Promise.promisify(require('request'));

const IWDP_CMD = 'ios_webkit_debug_proxy';
const MAX_RETRIES = 10;

class IWDP extends EventEmitter {

  constructor (udid = null) {
    super();
    this.udid = udid;
    this.attempts = 0;
    this.port = 27753;
    this.process = this.createIWDPProcess(); 
    this.endpoint = `http://localhost:${this.port}`;
  }

  createIWDPProcess () {
    let process = new SubProcess(IWDP_CMD, ['--config', `${this.udid}:${this.port},:${this.port + 1}-${this.port + 101}`]); // (see https://github.com/google/ios-webkit-debug-proxy for reference)// If the process exits and the exit wasn't requested by the API, restart it
    process.on('exit', () => this.onExit());
    return process;
  }

  async onExit () {
    if (!this.exitRequested) {
      delete this.process;
      this.process = this.createIWDPProcess();
      await this.start(); 
    }
  }

  async start () {
    if (++this.attempts > MAX_RETRIES) {
      return this.emit('error', new Error(`Failed to start IWDP server. Max retry attempts ${MAX_RETRIES} reached`));
    }
    this.exitRequested = false;
    await this.process.start(0);

    // Don't return until we confirm that the endpoint is accessible
    const TIMEOUT = 10000;
    const ENDPOINT_CHECK_DELAY = 300;
    let totalDelay = 0;
    while (totalDelay < TIMEOUT) {
      try {
        await request(this.endpoint);
        return this.emit('start');
      } catch (ign) {}
      await Promise.delay(ENDPOINT_CHECK_DELAY);
      totalDelay += ENDPOINT_CHECK_DELAY;
    }
    logger.errorAndThrow(`Timed out waiting for ios_webkit_debug_proxy to open`);
  }

  async stop () {
    this.attempts = 0;
    this.exitRequested = true;
    return await this.process.stop();
  }

	/**
	 * Is 'ios_webkit_debug_proxy' available?
	 */
  static isSupported () {
    try {
      execSync(`which ${IWDP_CMD}`);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export default IWDP;