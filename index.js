#!/usr/bin/env node
// transpile:main

import yargs from 'yargs';
import { asyncify } from 'asyncbox';
import { startServer, startHttpsServer } from './lib/server';
import { IosDriver, defaultServerCaps } from './lib/driver';
import { desiredCapConstraints, desiredCapValidation } from './lib/desired-caps';
import { commands, iosCommands } from './lib/commands/index';
import * as settings from './lib/settings';
import * as device from './lib/device';
import utils from './lib/utils';
import { IWDP } from './lib/iwdp';
import * as uiauto from './lib/uiauto/uiauto';
import { Instruments, instrumentsUtils } from './lib/instruments/index';


const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 4723;

async function main () {
  let port = yargs.argv.port || DEFAULT_PORT;
  let host = yargs.argv.host || DEFAULT_HOST;
  return startServer(port, host);
}

if (require.main === module) {
  asyncify(main);
}

export { IosDriver, desiredCapConstraints, desiredCapValidation, commands,
         iosCommands, settings, device, defaultServerCaps, utils, IWDP, uiauto,
         Instruments, instrumentsUtils, startHttpsServer };

export default IosDriver;


// ios log access
import IOSLog from './lib/device-log/ios-log';
import IOSCrashLog from './lib/device-log/ios-crash-log';
import IOSPerformanceLog from './lib/device-log/ios-performance-log';

export { IOSLog, IOSCrashLog, IOSPerformanceLog };

// app utils
import * as appUtils from './lib/app-utils';

export { appUtils };
