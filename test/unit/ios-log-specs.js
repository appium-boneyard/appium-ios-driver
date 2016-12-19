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
});
