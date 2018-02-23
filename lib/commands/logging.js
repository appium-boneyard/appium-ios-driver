import _ from 'lodash';
import IOSLog from '../device-log/ios-log';
import IOSCrashLog from '../device-log/ios-crash-log';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

async function extractLogs (logsContainer, logType) {
  // make sure that we have logs at all
  // otherwise it's not been initialized
  if (_.isEmpty(logsContainer)) {
    throw new Error('No logs currently available. Is the device/simulator started?');
  }

  // If logs captured successfully send response with data, else send error
  const logObject = logsContainer[logType];
  const logs = logObject ? await logObject.getLogs() : null;
  if (logs) {
    return logs;
  }
  throw new Error(`No logs of type '${logType}' found.`);
}

const SUPPORTED_LOG_TYPES = {
  syslog: {
    description: 'System Logs - Device logs for iOS applications on real devices and simulators',
    getter: async (self) => await extractLogs(self.logs, 'syslog'),
  },
  crashlog: {
    description: 'Crash Logs - Crash reports for iOS applications on real devices and simulators',
    getter: async (self) => await extractLogs(self.logs, 'crashlog'),
  },
  performance: {
    description: 'Performance Logs - Debug Timelines on real devices and simulators',
    getter: async (self) => await extractLogs(self.logs, 'performance'),
  },
  server: {
    description: 'Appium server logs',
    getter: (self) => {
      if (!self.relaxedSecurityEnabled) {
        throw new Error('Appium server must have relaxed security flag set ' +
                        'in order to retrieve server logs');
      }
      return logger.record;
    },
  },
};

commands.getLogTypes = function () {
  logger.debug('Retrieving supported log types');
  return _.keys(SUPPORTED_LOG_TYPES);
};

commands.getLog = async function (logType) {
  logger.debug(`Retrieving '${logType}' logs`);
  if (!_.has(SUPPORTED_LOG_TYPES, logType)) {
    const logsTypesWithDescrptions = {};
    for (const type of _.keys(SUPPORTED_LOG_TYPES)) {
      logsTypesWithDescrptions[type] = SUPPORTED_LOG_TYPES[type].description;
    }
    throw new Error(`Unsupported log type '${logType}'. ` +
                    `Supported types: ${JSON.stringify(logsTypesWithDescrptions)}`);
  }

  return await SUPPORTED_LOG_TYPES[logType].getter(this);
};

helpers.startLogCapture = async function (sim) {
  if (!_.isEmpty(this.logs)) {
    logger.warn("Trying to start iOS log capture but it's already started!");
    return;
  }
  this.logs.crashlog = new IOSCrashLog();
  this.logs.syslog = new IOSLog({
    sim,
    udid: this.opts.udid,
    showLogs: this.opts.showIOSLog,
    realDeviceLogger: this.opts.realDeviceLogger,
    xcodeVersion: this.xcodeVersion,
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
