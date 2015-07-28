import path from 'path';
import _ from 'lodash';
import which from 'which';
import glob from 'glob';
import { fs, getLogger } from 'appium-logger';
import _mkdirp from 'mkdirp';
import touch from 'touch';
import xcode from 'xcode'; 
import B from 'bluebird';
import { SubProcess } from 'teen_process';

// Date-Utils: Polyfills for the Date object
require('date-utils'); 

const START_TIMEOUT = 10000;
const logger = getLogger('iOSLog');
const mkdirp = B.promisify(_mkdirp);

class IOSLog { 
  constructor(opts) {
    this.udid = opts.udid;
    this.simUdid = opts.simUdid;
    this.showLogs = opts.showLogs;
    this.proc = null;
    this.iosLogStarted = false;
    this.iosLogStartTime = null;
    this.loggingModeOn = true;
    this.logs = [];
    this.logRow = '';
    this.logsSinceLastRequest = [];
  }

  async startCaptureRealDevice () {
    this.loggingModeOn = false;
    let spawnEnv = _.clone(process.env);
    logger.debug('Attempting iOS device log capture via libimobiledevice idevicesyslog');
    let err = await which('idevicesyslog');
    if (!err) { 
      this.proc = new SubProcess('idevicesyslog', {env: spawnEnv});
    } else {
      logger.warn('Could not capture device log using libimobiledevice idevicesyslog.' +
          ' Libimobiledevice probably is not installed');
      logger.debug('Attempting iOS device log capture via deviceconsole');
      let limDir = path.resolve(__dirname, '../../../build/deviceconsole');
      spawnEnv.PATH = `${process.env.PATH}:${limDir}`;
      spawnEnv.DYLD_LIBRARY_PATH = `${limDir}:${process.env.DYLD_LIBRARY_PATH}`;
      this.proc = new SubProcess('deviceconsole', ['-u', this.udid], {env: spawnEnv});
    }
    await this.finishStartingLogCapture();
  }

  async startCapture () {
    if (this.udid) { // if we have a real device
      return await this.startCaptureRealDevice();
    } 
    // otherwise, if we have a simulator...
    let xcodeVersion = await xcode.getVersion();
    let ver = parseInt(xcodeVersion.split('.')[0], 10);

    if (ver < 5) {
      logger.debug('Starting iOS6.* simulator log capture');
      this.proc = new SubProcess('tail', ['-f', '-n', '1', '/var/log/system.log']);
      await this.finishStartingLogCapture();
      return;
    }

    let logsPath;

    if (ver >= 6) { 
      logger.debug('Starting iOS 8.*/9.* simulator log capture');
      if (_.isUndefined(this.simUdid)) {
        logger.errorAndThrow('iOS 8*/9.* log capture requires a sim udid'); 
      }
      logsPath = path.resolve(process.env.HOME, 'Library', 'Logs', 'CoreSimulator', this.simUdid); 
    } else {
      logger.debug('Starting iOS7.* simulator log capture');
      logsPath = path.resolve(process.env.HOME, 'Library', 'Logs', 'iOS Simulator', '7.*');
    }
    //TODO : rather than passing a simUdid, should pass a simulator object

    try {
      if (logsPath.indexOf('*') >= 0) {
        return; 
      }
      let systemLogPath = path.resolve(logsPath, 'system.log');
      await mkdirp(logsPath);
      await fs.appendFile(systemLogPath);   
      let files;
      try {
        files = await glob(systemLogPath);
        if (files.length < 1) {
          throw new Error("Could not start log capture");
        }
      } catch (e) {
        logger.error(`Could not start log capture because no iOS ` +
                     `simulator logs could be found at ${logsPath}/system.log` +
                     `Logging will not be functional for this run`);
      }

      let lastModifiedLogPath = files[0];
      let lastModifiedLogTime = await fs.stat(files[0]).mtime;
      for (let file in files) {
        let mtime = await fs.stat(file).mtime;
        if (mtime > lastModifiedLogTime) {
          lastModifiedLogPath = file;
          lastModifiedLogTime = mtime;
        }
      }
      this.proc = new SubProcess('tail', ['-f', '-n', '1', lastModifiedLogPath]);
      await this.finishStartingLogCapture();
    } catch (err) {
      logger.warn('System log capture failed.');
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
            this.onOutput();
            firstLine = false; 
          } 
        } else {
          this.logRow += stdout;
          if (stdout.substr(-1, 1) === '\n') {
            this.onOutput('');
            this.logRow = ''; 
          }
        }
      } 
      if (stderr) {
        this.onOutput(' STDERR');
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

  stopCapture () {
    logger.debug('Stopping iOS log capture');
    if (this.proc) {
      this.proc.kill();
    }
    this.proc = null; 
  }

  onOutput (prefix) {
    if (!this.iosLogStarted) {
      this.iosLogStarted = true;
      this.iosLogStartTime = new Date();
    }

    let logs = this.logRow.split('\n');
    for (let log in logs) {
      log = log.trim();
      if (log) {
        if (!this.loggingModeOn) {
          let logRowParts = log.split(/\s+/);
          let logRowDate = new Date(`${this.iosLogStartTime.getFullYear()} ${logRowParts[0]} ${logRowParts[1]} ${logRowParts[2]}`);
            if (logRowDate.isAfter(this.iosLogStartTime)) {
            this.loggingModeOn = true;
            }
          }
        if (this.loggingModeOn) {
          let logObj = {
            timeStamp: Date.now(),
            level: 'ALL',
            message: log
          };
          this.logs.push(logObj);
          this.logsSinceLastRequest.push(logObj);
          if (this.showLogs) {
            logger.info(`[IOS_SYSLOG_ROW ${prefix}] ${log}`);
          }
        }
      }
    }
  }

  getLogs () {
    let ret = this.logsSinceLastRequest;
    this.logsSinceLastRequest = [];
    return ret;
  }

  getAllLogs () {
    return this.logs;
  }
}

export default IOSLog;