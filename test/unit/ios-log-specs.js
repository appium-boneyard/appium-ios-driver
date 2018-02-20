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


const should = chai.should();
chai.use(chaiAsPromised);

const LOG_DIR = path.resolve('test', 'assets', 'logs');

describe('system logs', function () {
  let tmpSystemLog;
  let sim;
  beforeEach(async function () {
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
  afterEach(async function () {
    if (await fs.exists(tmpSystemLog)) {
      await fs.unlink(tmpSystemLog);
    }
  });

  it('should begin log capture', async function () {
    let log = new IOSLog({
      sim,
      showLogs: true,
      xcodeVersion: {
        major: 7
      },
    });
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

    let log = new IOSLog({
      sim,
      showLogs: false,
      xcodeVersion: {
        major: 7
      },
    });
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
    function getLogger (realDeviceLogger, udid = '1234') {
      let log = new IOSLog({sim, udid, realDeviceLogger});
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
      describe('cache idevicesyslog instances', function () {
        let log, logForSameDevice, logForOtherDevice;

        before (async function () {
          // reset the cached logs in case other tests had some subprocesses cached
          IOSLog.cachedIDeviceSysLogs = {};
        });

        beforeEach(async function () {
          // Create two loggers for udid 1234 and one for udid 4567
          log = getLogger('idevicesyslog');
          logForSameDevice = getLogger('idevicesyslog');
          logForOtherDevice = getLogger('idevicesyslog', '4567');

          // Start capturing
          await log.startCapture();
          await logForSameDevice.startCapture();
          await logForOtherDevice.startCapture();
        });

        afterEach(async function () {
          await log.stopCapture();
          await logForSameDevice.stopCapture();
          await logForOtherDevice.stopCapture();
        });

        it('should use same subprocess for same device', async function () {
          logForSameDevice.proc.should.equal(log.proc);
          logForOtherDevice.proc.should.not.equal(log.proc);
        });

        it('should cache idevicesyslog subprocesses per device', async function () {
          IOSLog.cachedIDeviceSysLogs[log.subprocessId].proc.should.equal(log.proc);
          IOSLog.cachedIDeviceSysLogs[log.subprocessId].proc.should.equal(logForSameDevice.proc);
          IOSLog.cachedIDeviceSysLogs[log.subprocessId].count.should.equal(2);
          IOSLog.cachedIDeviceSysLogs[logForOtherDevice.subprocessId].proc.should.equal(logForOtherDevice.proc);
          IOSLog.cachedIDeviceSysLogs[logForOtherDevice.subprocessId].count.should.equal(1);
        });

        it('should delete cached subprocess for a device when its only logger has stopped', async function () {
          IOSLog.cachedIDeviceSysLogs[logForOtherDevice.subprocessId].should.exist;
          await logForOtherDevice.stopCapture();
          should.not.exist(IOSLog.cachedIDeviceSysLogs[logForOtherDevice.subprocessId]);
        });

        it('should delete cached subprocesses for a device when all loggers per stopped', async function () {
          IOSLog.cachedIDeviceSysLogs[log.subprocessId].should.exist;
          await log.stopCapture();
          IOSLog.cachedIDeviceSysLogs[log.subprocessId].should.exist;
          await logForSameDevice.stopCapture();
          should.not.exist(IOSLog.cachedIDeviceSysLogs[log.subprocessId]);
          await logForOtherDevice.stopCapture();
          IOSLog.cachedIDeviceSysLogs.should.eql({});
        });

        it('should not stop idevicesyslog if another one is open for the same device', async function () {
          const killSubProcSpy = sinon.spy(log, 'killLogSubProcess');
          const otherKillSubProcSpy = sinon.spy(logForSameDevice, 'killLogSubProcess');
          await log.stopCapture();
          await logForSameDevice.stopCapture();

          killSubProcSpy.notCalled.should.be.true;
          otherKillSubProcSpy.calledOnce.should.be.true;
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
