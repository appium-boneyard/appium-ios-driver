import path from 'path';
import _ from 'lodash';
import { fs } from 'appium-support';
import logger from './logger';
import B from 'bluebird';


class IOSCrashLog {
  constructor (logDir) {
    this.logDir = logDir || path.resolve(process.env.HOME || '/', 'Library', 'Logs', 'DiagnosticReports');
    this.prevLogs = [];
    this.logsSinceLastRequest = [];
  }

  async getCrashes () {
    try {
      return await fs.glob(`${this.logDir}/*.crash`);
    } catch (err) {
      logger.errorAndThrow(`There was a problem getting the crash list: ${err}`);
    }
  }

  async filesToJSON (files) {
    return await B.map(files, async (file) => {
      let filename = path.resolve(this.logDir, file);
      let stat = await fs.stat(filename);
      return {
        timestamp: stat.ctime.getTime(),
        level: 'ALL',
        message: await fs.readFile(filename, 'utf8')
      };
    });
  }

  async startCapture () {
    this.prevLogs = await this.getCrashes();
  }

  async stopCapture () {
    // needed for consistent API with other logs
  }

  async getLogs () {
    let crashFiles = await this.getCrashes();
    let diff = _.difference(crashFiles, this.prevLogs, this.logsSinceLastRequest);
    this.logsSinceLastRequest = _.union(this.logsSinceLastRequest, diff);
    return await this.filesToJSON(diff);
  }

  async getAllLogs () {
    let crashFiles = await this.getCrashes();
    let logFiles = _.difference(crashFiles, this.prevLogs);
    return await this.filesToJSON(logFiles);
  }
}

export { IOSCrashLog };
export default IOSCrashLog;
