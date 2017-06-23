// transpile:mocha

import { IOSLog } from '../..';
import { DEVICE_CONSOLE_PATH } from '../../lib/device-log/ios-log';
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
    let recentLogs = await log.getLogs();
    recentLogs.should.have.lengthOf(0);
    log.logIdxSinceLastRequest.should.be.below(0);

    for (let i = 1; i <= logRecordsCount; ++i) {
      log.logRow = `${i}\n`;
      log.onOutput();
      if (i >= sliceSizeLimit && i % sliceSizeLimit === 0) {
        let previousRecentLogs = recentLogs;
        recentLogs = await log.getLogs();
        if (previousRecentLogs.length && recentLogs.length) {
          previousRecentLogs[0].message.should.not.be.equal(recentLogs[0].message);
        }
        recentLogs.should.have.lengthOf(sliceSizeLimit);
        let reminder = log.logIdxSinceLastRequest % sliceSizeLimit;
        reminder.should.equal(0);
      }
      log.logs.should.have.lengthOf(i < maxBufferSize ? i : maxBufferSize);
    }

    const firstBufferMessage = parseInt(log.logs[0].message, 10);
    firstBufferMessage.should.be.equal(logRecordsCount - log.logs.length + 1);
    const lastBufferMessage = parseInt(log.logs[log.logs.length - 1].message, 10);
    lastBufferMessage.should.be.equal(logRecordsCount);
  });

  describe('real device logging', function () {
    function getLogger (realDeviceLogger) {
      let log = new IOSLog({sim, udid: '1234', realDeviceLogger});
      log.finishStartingLogCapture = async function () {};
      return log;
    }
    describe('idevicesyslog', function () {
      describe('system version', function () {
        let whichStub;
        afterEach(function () {
          whichStub.restore();
        });

        it('should use system idevicesyslog if no path specified', async function () {
          whichStub = sinon.stub(fs, 'which').returns('/path/to/idevicesyslog');
          let log = getLogger('idevicesyslog');
          await log.startCapture();
          log.proc.cmd.should.eql('idevicesyslog');
        });
        it('should fail if no system idevicesyslog found', async function () {
          whichStub = sinon.stub(fs, 'which').throws(new Error('ENOENT'));
          let log = getLogger('idevicesyslog');
          await log.startCapture().should.eventually.be.rejectedWith(/Unable to find system idevicesyslog/);
        });
      });
      describe('specific path', function () {
        let existstub;
        afterEach(function () {
          existstub.restore();
        });
        it('should use specified idevicesyslog if given', async function () {
          existstub = sinon.stub(fs, 'exists').returns(true);
          let log = getLogger('/path/to/my/idevicesyslog');
          await log.startCapture();
          log.proc.cmd.should.eql('/path/to/my/idevicesyslog');
        });
        it('should fail if specified idevicesyslog is not found', async function () {
          existstub = sinon.stub(fs, 'exists').returns(false);
          let log = getLogger('/path/to/my/idevicesyslog');
          await log.startCapture().should.eventually.be.rejectedWith(/Unable to find idevicesyslog from 'realDeviceLogger' capability/);
        });
      });
    });
    describe('deviceconsole', function () {
      let dcPath = '/path/to/deviceconsole/install/directory';
      let statStub;
      afterEach(function () {
        statStub.restore();
      });

      function initStatStub (directory = true, throws = false) {
        statStub = sinon.stub(fs, 'stat');
        if (throws) {
          statStub.throws(new Error('ENOENT'));
        } else {
          statStub.returns({
            isDirectory () {
              return directory;
            }
          });
        }
      }

      it('should correctly parse the install directory from executable path', async function () {
        initStatStub(false);
        let log = getLogger(`${dcPath}/deviceconsole`);
        await log.startCapture();
        log.proc.cmd.should.eql(`${dcPath}/deviceconsole`);
        log.proc.opts.env.DYLD_LIBRARY_PATH.indexOf(dcPath).should.eql(0);
      });
      it('should correctly use the install directory when given directly', async function () {
        initStatStub();
        let log = getLogger(dcPath);
        await log.startCapture();
        log.proc.cmd.should.eql(`${dcPath}/deviceconsole`);
        log.proc.opts.env.DYLD_LIBRARY_PATH.indexOf(dcPath).should.eql(0);
      });
      it('should use default deviceconsole if path not passed in', async function () {
        initStatStub();
        let log = getLogger(`deviceconsole`);
        await log.startCapture();
        log.proc.cmd.should.eql(`${DEVICE_CONSOLE_PATH}/deviceconsole`);
        log.proc.opts.env.DYLD_LIBRARY_PATH.indexOf(DEVICE_CONSOLE_PATH).should.eql(0);
      });
      it('should fail if an executable other than deviceconsole is passed in', async function () {
        initStatStub(false);
        let log = getLogger(`${dcPath}/someotherlogger`);
        await log.startCapture().should.eventually.be.rejectedWith(/Unable to parse 'deviceconsole' installation directory/);
      });
      it('should fail if path passed in is not stat-able', async function () {
        initStatStub(false, true);
        let log = getLogger(`/path/to/something/that/does/not/exist`);
        await log.startCapture().should.eventually.be.rejectedWith(/Unknown 'realDeviceLogger'/);
      });
    });

    describe('anything else', function () {
      it('should fail if something other than idevicesyslog or deviceconsole are specified', async function () {
        let log = getLogger('mysupadupalogga');
        await log.startCapture().should.eventually.be.rejectedWith(/Unable to capture device log. Unknown 'realDeviceLogger'/);
      });
    });
  });
});
