// transpile:mocha

import { IOSLog } from '../..';
import sinon from 'sinon';
import { fs } from 'appium-support';
import path from 'path';
import logger from '../../lib/device-log/logger';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';


chai.should();
chai.use(chaiAsPromised);

const LOG_DIR = path.resolve('test', 'assets', 'logs');

describe('system logs', () => {
  let tmpSystemLog;
  let sim;
  beforeEach(async () => {
    // get the simulator, and stub what will be called
    sim = {
      udid: 'fake-udid',
      getLogDir: () => {},
      getPlatformVersion: () => {}
    };
    sinon.stub(sim, 'getLogDir').returns(LOG_DIR);
    sinon.stub(sim, 'getPlatformVersion').returns('8.4');

    // copy the file into a temporary location, so we can muck with it
    let fixSystemLog = path.resolve(LOG_DIR, 'system.log.fixture');
    tmpSystemLog = path.resolve(LOG_DIR, 'system.log');
    await fs.copyFile(fixSystemLog, tmpSystemLog);
  });
  afterEach(async () => {
    if (await fs.exists(tmpSystemLog)) {
      await fs.unlink(tmpSystemLog);
    }
  });

  it('should begin log capture', async function () {
    let log = new IOSLog({sim, showLogs: true});
    let spy = sinon.spy(logger, 'info');

    await log.startCapture();

    let message = 'This is a test log line';
    await fs.writeFile(tmpSystemLog, `${message}\n`, {flag: 'a'});

    // on some slow system (e.g., Travis) need a moment
    await B.delay(500);

    spy.calledWith(`[IOS_SYSLOG_ROW] ${message}`).should.be.true;

    await log.stopCapture();
  });

  it('should rotate log buffer', async function () {
    const maxBufferSize = 10;
    const sliceSizeLimit = maxBufferSize / 2;
    sliceSizeLimit.should.be.below(maxBufferSize);
    const logRecordsCount = maxBufferSize * 2;
    logRecordsCount.should.be.above(maxBufferSize);

    let log = new IOSLog({sim, showLogs: false});
    log.maxBufferSize = maxBufferSize;
    log.logIdxSinceLastRequest.should.be.below(0);
    await log.startCapture();
    let recentLogs = await log.getLogs();
    recentLogs.should.have.lengthOf(0);
    log.logIdxSinceLastRequest.should.be.below(0);

    for (let i = 1; i <= logRecordsCount; ++i) {
      await fs.writeFile(tmpSystemLog, `${i}\n`, {flag: 'a'});
      // This is to make sure the new entry has been captured on slow Travis nodes
      await B.delay(10);
      if (i >= sliceSizeLimit && i % sliceSizeLimit === 0) {
        // on some slow system (e.g., Travis) need a moment
        let previousRecentLogs = recentLogs;
        recentLogs = await log.getLogs();
        if (previousRecentLogs.length && recentLogs.length) {
          previousRecentLogs[0].message.should.not.be.equal(recentLogs[0].message);
        }
        recentLogs.should.have.length.within(1, sliceSizeLimit);
        log.logIdxSinceLastRequest.should.be.within(0, log.logs.length);
      }
      log.logs.should.have.length.at.most(maxBufferSize);
    }

    // This is to make sure the new entry has been captured on slow Travis nodes
    await B.delay(30);
    log.logs.should.have.lengthOf(maxBufferSize);
    const firstBufferMessage = parseInt(log.logs[0].message, 10);
    firstBufferMessage.should.be.equal(logRecordsCount - log.logs.length + 1);
    const lastBufferMessage = parseInt(log.logs[log.logs.length - 1].message, 10);
    lastBufferMessage.should.be.equal(logRecordsCount);

    await log.stopCapture();
  });
});
