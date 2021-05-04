#!/usr/bin/env node
// transpile:main

import { asyncify } from 'asyncbox';
import * as server from './lib/server';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 4723;

async function main () {
  const getArgValue = (argName) => {
    const argIndex = process.argv.indexOf(argName);
    return argIndex > 0 ? process.argv[argIndex + 1] : null;
  };
  const port = parseInt(getArgValue('--port'), 10) || DEFAULT_PORT;
  const host = getArgValue('--host') || DEFAULT_HOST;
  return await server.startServer(port, host);
}

if (require.main === module) {
  asyncify(main);
}


import * as driver from './lib/driver';
import * as caps from './lib/desired-caps';
import * as commandIndex from './lib/commands/index';
import * as settings from './lib/settings';
import * as device from './lib/device';
import * as utils from './lib/utils';
import * as iwdp from './lib/iwdp';
import * as uiauto from './lib/uiauto/uiauto';
import * as instruments from './lib/instruments/index';
import * as context from './lib/commands/context';

const startHttpsServer = server.startHttpsServer;
const { IosDriver, defaultServerCaps } = driver;
const { desiredCapConstraints, desiredCapValidation } = caps;
const { commands, iosCommands } = commandIndex;
const { IWDP } = iwdp;
const { Instruments, instrumentsUtils } = instruments;
const { NATIVE_WIN, WEBVIEW_WIN } = context;

export {
  IosDriver, desiredCapConstraints, desiredCapValidation, commands, iosCommands,
  settings, device, defaultServerCaps, utils, IWDP, uiauto, Instruments,
  instrumentsUtils, startHttpsServer, NATIVE_WIN, WEBVIEW_WIN,
};

export default IosDriver;


// ios log access
import Log from './lib/device-log/ios-log';
import CrashLog from './lib/device-log/ios-crash-log';
import PerformanceLog from './lib/device-log/ios-performance-log';

const IOSLog = Log;
const IOSCrashLog = CrashLog;
const IOSPerformanceLog = PerformanceLog;

export { IOSLog, IOSCrashLog, IOSPerformanceLog };

// app utils
import * as appUtils from './lib/app-utils';

export { appUtils };

// iOS authorize
import { authorize } from './bin/authorize-ios';

export { authorize };
