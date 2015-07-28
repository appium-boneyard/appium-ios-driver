import path from 'path';
import _ from 'lodash';
import _glob from 'glob';
import { fs, getLogger } from 'appium-support';
import B from 'bluebird';
import { asyncmap } from 'asyncbox';

const glob = B.promisify(_glob);
const logger = getLogger('iOSCrashLog');
const CRASH_DIR = `${path.resolve(process.env.HOME, 'Library', 'Logs', 'DiagnosticReports')}`;

class IOSCrashLog { 
  constructor() {
    this.prevLogs = [];
    this.logsSinceLastRequest = [];
  }

  async getCrashes () {
    try {
      return await glob(`${CRASH_DIR}/*.crash`);
    } catch (err) {
      logger.errorAndThrow(`There was a problem getting the crash list: ${err}`);
    }
  }

  async filesToJSON (files) {
    return asyncmap(files, async (f) => {
      let filename = path.resolve(CRASH_DIR, f);
      let stat = await fs.stat(filename);
      return {
        timestamp: stat.ctime,
        level: 'ALL', 
        message: await fs.readFile(filename, 'utf8')
      };
    });
  }

  async startCapture () {
    let fileList = await this.getCrashes();
    this.prevLogs = fileList;
  }

  async getLogs () {
    let crashFiles = this.getCrashes();
    let diff = _.difference(crashFiles, this.prevLogs, this.logsSinceLastRequest);
    this.logsSinceLastRequest = _.union(this.logsSinceLastRequest, diff);
    return this.filesToJSON(diff);
  }

  async getAllLogs() {
    let crashFiles = this.getCrashes();
    let logFiles = _.difference(crashFiles, this.prevLogs);
    return this.filesToJSON(logFiles);
  }
}

export default IOSCrashLog;