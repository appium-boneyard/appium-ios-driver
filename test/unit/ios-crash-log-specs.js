// transpile:mocha

import { IOSCrashLog } from '../..';
import { fs } from 'appium-support';
import path from 'path';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';


chai.should();
chai.use(chaiAsPromised);

const LOG_DIR = path.resolve('test', 'assets', 'logs');

describe('crash logs', () => {
  let tmpFile1 = path.resolve(LOG_DIR, 'temp1.crash');
  let tmpFile2 = path.resolve(LOG_DIR, 'temp2.crash');
  let log;
  beforeEach(() => {
    log = new IOSCrashLog(LOG_DIR);
  });
  afterEach(async () => {
    if (await fs.exists(tmpFile1)) {
      await fs.unlink(tmpFile1);
    }
    if (await fs.exists(tmpFile2)) {
      await fs.unlink(tmpFile2);
    }
  });

  it('should get all the logs', async () => {
    (await log.getCrashes()).should.have.length(2);
  });

  it('should get an empty array when no new crashes have happened', async () => {
    log.startCapture();
    (await log.getLogs()).should.have.length(0);
  });

  it('should get new log', async () => {
    let start = await log.getCrashes();
    start.should.have.length(2);

    log.startCapture();

    // write to a new "crash" file
    let message = 'Test crash';
    await fs.writeFile(tmpFile1, message, {flag: 'a'});

    let end = await log.getLogs();
    end.should.have.length(1);
    end[0].message.should.equal(message);
  });

  it('should only get logs since the last time logs were retrieved', async () => {
    let start = await log.getCrashes();
    start.should.have.length(2);

    log.startCapture();

    // write to a new "crash" file
    let firstMessage = 'First test crash';
    await fs.writeFile(tmpFile1, firstMessage, {flag: 'a'});
    let middle = await log.getLogs();
    middle.should.have.length(1);
    middle[0].message.should.equal(firstMessage);

    let secondMessage = 'Second test crash';
    await fs.writeFile(tmpFile2, secondMessage, {flag: 'a'});
    let end = await log.getLogs();
    end.should.have.length(1);
    end[0].message.should.equal(secondMessage);
  });
});
