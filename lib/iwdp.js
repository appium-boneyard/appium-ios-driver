//import logger from './logger';
import { SubProcess } from 'teen_process';
import EventEmitter from 'events';
import requestSync from 'request';
import Promise from 'bluebird';
import { execSync } from 'child_process';

const request = Promise.promisify(requestSync);

const IWDP_CMD = 'ios_webkit_debug_proxy';
const MAX_RETRIES = 10;

class IWDP extends EventEmitter {

  constructor (udid = null) {
    super();

    this.attempts = 0;
    this.port = 27753;
    this.process = new SubProcess(IWDP_CMD, ['-c', `${udid}:${this.port},:${this.port + 1}-${this.port + 101}`]); // (see https://github.com/google/ios-webkit-debug-proxy for reference)
    this.endpoint = `http://localhost:${this.port}`;

    // If an error is logged, restart the process
    this.process.on('lines-stderr', async () => {
      await this.process.stop();
      this.start();
    });
  }

  async start () {
    if (++this.attempts >= MAX_RETRIES) {
      return this.emit('failure', `Failed to start IWDP server. Max retry attempts ${MAX_RETRIES} reached`);
    }

    // If it fails to start server, try again until max retries reached
    try {
      await this.process.start(0);
    } catch (e) {
      this.start();
    }
  }

  async stop () {
    this.attempts = 0;
    if (this.process) {
      return await this.process.stop();
    }
  }

  async getDevices () {
    let out = await request(this.endpoint + '/json');
    return JSON.parse(out[0].body);
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