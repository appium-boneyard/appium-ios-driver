//import logger from './logger';
import { SubProcess } from 'teen_process';
import EventEmitter from 'events';
import requestSync from 'request';
import Promise from 'Bluebird';

const request = Promise.promisify(requestSync);

const IWDP_CMD = 'ios_webkit_debug_proxy';
const MAX_RETRIES = 10;

export default class IWDP extends EventEmitter {

  constructor() {
  	super();
  	this.attempts = 0;
    this.process = new SubProcess(IWDP_CMD);
    this.endpoint = `http://localhost:9221`;

    this.process.on('exit', (code) => {
	  console.log('Exiting', code);
    });

    // If an error is logged out
    this.process.on('lines-stderr', async () => {
	  await this.process.stop();
	  this.start();
    });
  }

  async start() {
  	if (++this.attempts >= MAX_RETRIES) {
	  return this.emit('failure', `Failed to start IWDP server. Max retry attempts ${MAX_RETRIES} reached`);
  	}

  	// If it fails to start server, try again until max retries reached
  	try {
  	  await this.process.start(0);
  	} catch(e) {
  	  this.start();
  	}
  }

  async stop() {
  	this.attempts = 0;
  	if (this.process) {
  		await this.process.stop();
  	}
  }

  async getDevices() {
  	let out = await request(this.endpoint + '/json');
  	return JSON.parse(out[0].body);
  }

  reset() {
  	this.stop();
  	this.start();
  }

}