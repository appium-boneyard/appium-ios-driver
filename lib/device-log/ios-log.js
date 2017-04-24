import path from 'path';
import _ from 'lodash';
import logger from './logger';
import { fs, mkdirp } from 'appium-support';
import xcode from 'appium-xcode';
import { SubProcess } from 'teen_process';

const START_TIMEOUT = 10000;
const DEVICE_CONSOLE_PATH = path.resolve(__dirname, '..', '..', '..', 'build', 'deviceconsole');
const SYSTEM_LOG_PATH = '/var/log/system.log';
// We keep only the most recent log entries to avoid out of memory error
const MAX_LOG_ENTRIES_COUNT = 10000;

class IOSLog {
  constructor (opts) {
    this.sim = opts.sim;
    this.udid = opts.udid;
    this.showLogs = !!opts.showLogs;

    this.proc = null;
    this.logs = [];
    this.logRow = '';
    this.logIdxSinceLastRequest = -1;
    this.maxBufferSize = MAX_LOG_ENTRIES_COUNT;
  }

  async startCaptureRealDevice () {
    let spawnEnv = _.clone(process.env);
    logger.debug('Attempting iOS device log capture via libimobiledevice idevicesyslog');
    try {
      let idevicesyslog = await fs.which('idevicesyslog');
      logger.debug(`Found idevicesyslog: '${idevicesyslog}'`);
      this.proc = new SubProcess('idevicesyslog', ['-u', this.udid], {env: spawnEnv});
    } catch (err) {
      logger.warn('Could not capture device log using libimobiledevice idevicesyslog. ' +
                  'Libimobiledevice is probably not installed');
      logger.debug('Attempting iOS device log capture via deviceconsole');
      spawnEnv.PATH = `${process.env.PATH}:${DEVICE_CONSOLE_PATH}`;
      spawnEnv.DYLD_LIBRARY_PATH = `${DEVICE_CONSOLE_PATH}:${process.env.DYLD_LIBRARY_PATH}`;
      this.proc = new SubProcess('deviceconsole', ['-u', this.udid], {env: spawnEnv});
    }
    await this.finishStartingLogCapture();
  }

  async startCapture () {
    if (this.udid) { // if we have a real device
      return this.startCaptureRealDevice();
    }
    // otherwise, if we have a simulator...
    let xCodeVersion = await xcode.getVersion(true);

    logger.debug(`Starting iOS ${await this.sim.getPlatformVersion()} simulator log capture`);
    if (xCodeVersion.major < 5) {
      this.proc = new SubProcess('tail', ['-f', '-n', '1', SYSTEM_LOG_PATH]);
      await this.finishStartingLogCapture();
      return;
    }

    // this is xcode 6+
    if (_.isUndefined(this.sim.udid)) {
      logger.errorAndThrow(`iOS ${xCodeVersion.versionString} log capture requires a sim udid`);
    }

    let logPath = this.sim.getLogDir();
    try {
      if (logPath.indexOf('*') >= 0) {
        logger.error(`Log path has * in it. Unable to start log capture: ${logPath}`);
        return;
      }
      let systemLogPath = path.resolve(logPath, 'system.log');
      logger.debug(`System log path: ${systemLogPath}`);
      await mkdirp(logPath);
      await fs.writeFile(systemLogPath, 'A new Appium session is about to start!\n', {flag: 'a'});
      let files;
      try {
        files = await fs.glob(systemLogPath);
        if (files.length < 1) {
          throw new Error('Could not start log capture');
        }
      } catch (e) {
        logger.error(`Could not start log capture because no iOS ` +
                     `simulator logs could be found at ${systemLogPath}. ` +
                     `Logging will not be functional for this run`);
      }

      let lastModifiedLogPath = files[0];
      let lastModifiedLogTime = await fs.stat(lastModifiedLogPath).mtime;
      for (let file of files) {
        let mtime = await fs.stat(file).mtime;
        if (mtime > lastModifiedLogTime) {
          lastModifiedLogPath = file;
          lastModifiedLogTime = mtime;
        }
      }
      this.proc = new SubProcess('tail', ['-f', '-n', '1', lastModifiedLogPath]);
      await this.finishStartingLogCapture();
    } catch (err) {
      logger.errorAndThrow(`System log capture failed: ${err.message}`);
    }
  }

  async finishStartingLogCapture () {
    if (!this.proc) {
      logger.errorAndThrow('Could not capture device log');
    }
    let firstLine = true;
    this.proc.on('output', (stdout, stderr) => {
      if (stdout) {
        if (firstLine) {
          if (stdout.substr(-1, 1) === '\n') {
            // don't store the first line of the log because it came before the sim or device was launched
            firstLine = false;
          }
        } else {
          this.logRow += stdout;
          if (stdout.substr(-1, 1) === '\n') {
            this.onOutput();
            this.logRow = '';
          }
        }
      }
      if (stderr) {
        this.onOutput('STDERR');
      }
    });

    let sd = (stdout, stderr) => {
      if (/execvp\(\)/.test(stderr)) {
        throw new Error('iOS log capture process failed to start');
      }
      return stdout || stderr;
    };
    await this.proc.start(sd, START_TIMEOUT);
  }

  async stopCapture () {
    logger.debug('Stopping iOS log capture');
    if (this.proc && this.proc.isRunning) {
      try {
        await this.proc.stop('SIGTERM', 1000);
      } catch (e) {
        logger.error('Cannot stop log capture process. Sending SIGKILL...');
        await this.proc.stop('SIGKILL');
      }
    }
    this.proc = null;
  }

  onOutput (prefix = '') {
    let logs = this.logRow.split('\n');
    for (let log of logs) {
      if (!log) continue;
      let logObj = {
        timestamp: Date.now(),
        level: 'ALL',
        message: log
      };
      this.logs.push(logObj);
      if (this.logs.length > this.maxBufferSize) {
        this.logs.shift();
        if (this.logIdxSinceLastRequest > 0) {
          --this.logIdxSinceLastRequest;
        }
      }
      if (this.showLogs) {
        let space = prefix.length > 0 ? ' ' : '';
        logger.info(`[IOS_SYSLOG_ROW${space}${prefix}] ${log}`);
      }
    }
  }

  async getLogs () {
    if (this.logs.length && this.logIdxSinceLastRequest < this.logs.length) {
      let result = this.logs;
      if (this.logIdxSinceLastRequest > 0) {
        result = result.slice(this.logIdxSinceLastRequest);
      }
      this.logIdxSinceLastRequest = this.logs.length;
      return result;
    }
    return [];
  }

  async getAllLogs () {
    return this.logs;
  }
}

export default IOSLog;
