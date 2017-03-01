import { exec, SubProcess } from 'teen_process';
import EventEmitter from 'events';
import logger from './logger';
import request from 'request-promise';
import { retryInterval } from 'asyncbox';

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
      this.process = this.createIWDPProcess();
      await this.start(); 
    }
  }

  async start () {
    if (++this.attempts > MAX_RETRIES) {
      return this.emit('error', new Error(`Failed to start IWDP server. Max retry attempts ${MAX_RETRIES} reached`));
    }
    this.exitRequested = false;

    // Throw error if ios_webkit_debug_proxy is not installed
    if (!await this.isSupported()) {
      logger.errorAndThrow(`'ios_webkit_debug_proxy' not installed on this machine. Try 'brew install ios-webkit-debug-proxy`);
    }
    
    await this.process.start(0);

    // Retry pinging the iwdp server until it's ready
    try {
      await retryInterval(20, 500, async () => await request(this.endpoint));
      this.emit('start');
    } catch (ign) {
      logger.errorAndThrow(`Timed out waiting for ios_webkit_debug_proxy to open`);
    }
  }

  async stop () {
    this.attempts = 0;
    this.exitRequested = true;
    return await this.process.stop();
  }

	/**
	 * Is 'ios_webkit_debug_proxy' available?
	 */
  async isSupported () {
    if (typeof(this.supported) !== 'undefined') {
      return this.supported;
    }

    try {
      await exec('which', [IWDP_CMD]);
      this.supported = true;
    } catch (e) {
      this.supported = false;
    }
    return this.supported;
  }
}

export default IWDP;