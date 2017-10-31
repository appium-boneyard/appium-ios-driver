import path from 'path';
import _ from 'lodash';
import logger from './logger';
import { fs } from 'appium-support';
import xcode from 'appium-xcode';
import { SubProcess, exec } from 'teen_process';

const START_TIMEOUT = 10000;
const DEVICE_CONSOLE_PATH = path.resolve(__dirname, '..', '..', '..', 'build', 'deviceconsole');
// We keep only the most recent log entries to avoid out of memory error
const MAX_LOG_ENTRIES_COUNT = 10000;

class IOSLog {
  constructor (opts) {
    this.sim = opts.sim;
    this.udid = opts.udid;
    this.showLogs = !!opts.showLogs;
    this.realDeviceLogger = opts.realDeviceLogger || 'idevicesyslog';

    this.proc = null;
    this.logs = [];
    this.logRow = '';
    this.logIdxSinceLastRequest = -1;
    this.maxBufferSize = MAX_LOG_ENTRIES_COUNT;
  }

  async startCaptureRealDevice () {
    let cmd, args, env;
    if ((this.realDeviceLogger || '').indexOf('idevicesyslog') !== -1) {
      logger.debug('Attempting iOS device log capture via libimobiledevice idevicesyslog');
      if (this.realDeviceLogger.toLowerCase() === 'idevicesyslog') {
        cmd = 'idevicesyslog';
        try {
          // make sure it is available on the PATH
          await fs.which('idevicesyslog');
        } catch (err) {
          throw new Error(`Unable to find system idevicesyslog: ${err.message}`);
        }
      } else {
        // make sure the executable exists
        if (!await fs.exists(this.realDeviceLogger)) {
          throw new Error(`Unable to find idevicesyslog from 'realDeviceLogger' capability '${this.realDeviceLogger}'`);
        }
        cmd = this.realDeviceLogger;
      }

      args = ['-u', this.udid];
      env = process.env;
    } else if ((this.realDeviceLogger || '').indexOf('deviceconsole') !== -1) {
      logger.debug('Attempting iOS device log capture via deviceconsole');
      let deviceconsole;
      if (this.realDeviceLogger.toLowerCase() === 'deviceconsole') {
        deviceconsole = DEVICE_CONSOLE_PATH;
      } else {
        // make sure that we have the path to the directory,
        // not the actual executable
        let stat;
        try {
          stat = await fs.stat(this.realDeviceLogger);
        } catch (err) {
          throw new Error(`Unable to find deviceconsole from 'realDeviceLogger' capability '${this.realDeviceLogger}': ${err.message}`);
        }
        if (stat.isDirectory()) {
          deviceconsole = this.realDeviceLogger;
        } else {
          // make sure they've passed in `deviceconsole` and not something random
          if (!_.endsWith(this.realDeviceLogger, 'deviceconsole')) {
            throw new Error(`Unable to parse 'deviceconsole' installation directory from '${this.realDeviceLogger}'`);
          }
          // remove the executable, and trailing `/`, to get the install directory
          deviceconsole = path.dirname(this.realDeviceLogger);
        }
      }

      logger.debug(`Using 'deviceconsole' from '${deviceconsole}'`);

      cmd = `${deviceconsole}/deviceconsole`;
      args = ['-u', this.udid];

      // set up the environment to be able to run deviceconsole
      env = _.clone(process.env);
      env.DYLD_LIBRARY_PATH = deviceconsole;
      if (process.env.DYLD_LIBRARY_PATH) {
        env.DYLD_LIBRARY_PATH = `${env.DYLD_LIBRARY_PATH}:${process.env.DYLD_LIBRARY_PATH}`;
      }
    } else {
      logger.errorAndThrow(`Unable to capture device log. Unknown 'realDeviceLogger': '${this.realDeviceLogger}'`);
    }

    logger.debug(`Starting iOS device log capture with: '${cmd}'`);

    try {
      // cleanup existing listeners if the previous session has not been terminated properly
      await exec('pkill', ['-xf', [cmd, ...args].join(' ')]);
    } catch (e) {}
    this.proc = new SubProcess(cmd, args, {env});

    await this.finishStartingLogCapture();
  }

  async startCapture () {
    if (this.udid) { // if we have a real device
      return this.startCaptureRealDevice();
    }
    // otherwise, if we have a simulator...
    let xCodeVersion = await xcode.getVersion(true);

    logger.debug(`Starting iOS ${await this.sim.getPlatformVersion()} simulator log capture`);

    if (_.isUndefined(this.sim.udid)) {
      logger.errorAndThrow(`iOS ${xCodeVersion.versionString} log capture requires a sim udid`);
    }

    const logsRoot = this.sim.getLogDir();
    try {
      if (logsRoot.indexOf('*') >= 0) {
        logger.error(`Log path has * in it. Unable to start log capture: ${logsRoot}`);
        return;
      }
      let systemLogPath = path.resolve(logsRoot, 'system.log');
      if (!await fs.exists(systemLogPath)) {
        throw new Error(`Could not start log capture because no iOS ` +
          `simulator logs could be found at ${systemLogPath}. ` +
          `Logging will not be functional for this run`);
      }
      logger.debug(`System log path: ${systemLogPath}`);

      const tailArgs = ['-f', '-n', '1', systemLogPath];
      try {
        // cleanup existing listeners if the previous session has not been terminated properly
        await exec('pkill', ['-xf', ['tail', ...tailArgs].join(' ')]);
      } catch (e) {}
      this.proc = new SubProcess('tail', tailArgs);
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
      if (!log) continue; // eslint-disable-line curly
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

export { IOSLog, DEVICE_CONSOLE_PATH };
export default IOSLog;
