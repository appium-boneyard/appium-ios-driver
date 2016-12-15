import _ from 'lodash';
import IOSLog from '../device-log/ios-log';
import IOSCrashLog from '../device-log/ios-crash-log';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

const SUPPORTED_LOG_TYPES = {
  'syslog': 'System Logs - Device logs for iOS applications on real devices and simulators',
  'crashlog': 'Crash Logs - Crash reports for iOS applications on real devices and simulators',
  'performance': 'Performance Logs - Debug Timelines on real devices and simulators'
};

commands.getLogTypes = async function () {
  logger.debug('Retrieving supported log types');
  return _.keys(SUPPORTED_LOG_TYPES);
};

commands.getLog = async function (logType) {
  logger.debug(`Retrieving '${logType}' logs`);
  // Check if passed logType is supported
  if (!_.has(SUPPORTED_LOG_TYPES, logType)) {
    throw new Error(`Unsupported log type '${logType}' for this device. Supported types : ${JSON.stringify(SUPPORTED_LOG_TYPES)}`);
  }

  // make sure that we have logs at all
  // otherwise it's not been initialized
  if (_.isEmpty(this.logs)) {
    throw new Error('No logs currently available. Is the device/simulator started?');
  }

  // If logs captured successfully send response with data, else send error
  let logs = await this.logs[logType].getLogs();
  if (logs) {
    return logs;
  } else {
    throw new Error(`No logs of type '${logType}' found.`);
  }
};

helpers.startLogCapture = async function (sim) {
  if (!_.isEmpty(this.logs)) {
    logger.warn("Trying to start iOS log capture but it's already started!");
    return;
  }
  this.logs.crashlog = new IOSCrashLog();
  this.logs.syslog = new IOSLog({
    sim,
    udid: this.opts.udid
  , showLogs: this.opts.showIOSLog
  });
  try {
    await this.logs.syslog.startCapture();
  } catch (err) {
    logger.warn("Could not capture logs from device. Continuing without capturing logs.");
    return;
  }
  await this.logs.crashlog.startCapture();
};


Object.assign(extensions, commands, helpers);
export { commands, helpers, SUPPORTED_LOG_TYPES };
export default extensions;
