import _ from 'lodash';
import logger from '../logger';

let commands = {};

const SUPPORTED_LOG_TYPES = {
  'syslog': 'System Logs - Device logs for iOS applications on real devices and simulators',
  'crashlog': 'Crash Logs - Crash reports for iOS applications on real devices and simulators',
  'performance': 'Performance Logs - Debug Timelines on real devices and simulators'
};

commands.getLogTypes = function () {
  logger.debug('Retrieving supported log types');
  return _.keys(SUPPORTED_LOG_TYPES);
};

commands.getLog = function (logType) {
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
  let logs = this.logs[logType].getLogs();
  if (logs) {
    return logs;
  } else {
    throw new Error(`No logs of type '${logType}' found.`);
  }
};

export { commands, SUPPORTED_LOG_TYPES };
export default commands;
