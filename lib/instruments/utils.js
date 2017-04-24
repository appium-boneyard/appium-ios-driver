import path from 'path';
import { exec } from 'teen_process';
import { fs } from 'appium-support';
import log from './logger';
import xcode from 'appium-xcode';
import _ from 'lodash';
import Instruments from './instruments';


const rootDir = path.resolve(__dirname, '../..');
const INST_STALL_TIMEOUT = 12000;

async function getInstrumentsPath () {
  let instrumentsPath;
  try {
    let {stdout} = await exec('xcrun', ['-find', 'instruments']);
    instrumentsPath = (stdout || '').trim().replace('\n$', '');
  } catch (err) {
    if (err) log.error(err.message);
  }
  if (!instrumentsPath) {
    log.errorAndThrow('Could not find the instruments binary. Please ensure ' +
                      '`xcrun -find instruments` can locate it.');
  }
  log.debug(`Instruments is at: ${instrumentsPath}`);
  return instrumentsPath;
}

async function getAvailableDevices (timeout = INST_STALL_TIMEOUT) {
  log.debug('Getting list of devices instruments supports');
  let instrumentsPath = await getInstrumentsPath();
  let opts = {timeout};
  let lines;
  try {
    let {stdout} = await exec(instrumentsPath, ['-s', 'devices'], opts);
    lines = stdout.split('\n');
  } catch (err) {
    log.errorAndThrow(`Failed getting devices, err: ${err}.`);
  }
  let devices = lines.filter((line) => {
    // https://regex101.com/r/aE6aS3/6
    return /^.+ \(\d+\.(\d+\.)?\d+( Simulator)?\) \[.+\]( \(Simulator\))?$/.test(line);
  });
  log.debug(`Available devices: ${devices}`);
  return devices;
}

async function killAllInstruments () {
  log.debug('Killing all instruments');
  try {
    await exec('pkill',  ['-f', 'instruments']);
  } catch (ign) {}
}

async function cleanAllTraces () {
  if (process.env.CLEAN_TRACES) {
    try {
      await fs.rimraf('instrumentscli*.trace');
    } catch (ign) {}
  }
}

function parseLaunchTimeout (launchTimeout) {
  // number or object like { global: 40000, afterSimLaunch: 5000 }
  // may also parse JSON strings.
  if (_.isString(launchTimeout)) {
    try {
      launchTimeout = JSON.parse(launchTimeout);
    } catch (err) {
      log.warn(`Invalid launch timeout: ${launchTimeout}`);
    }
  }
  if (_.isNumber(launchTimeout)) {
    launchTimeout = {
      global: launchTimeout
    };
  }
  return launchTimeout;
}

async function getIwdPath (xcodeMajorVersion) {
  let thirdpartyPath = path.resolve(rootDir, 'instruments-iwd');
  let iwdPath = path.resolve(thirdpartyPath, `iwd${xcodeMajorVersion}`);
  if (!await fs.exists(iwdPath)) {
    iwdPath = path.resolve(thirdpartyPath, 'iwd');
  }
  log.debug(`Found Insruments-Without-Delay: ${iwdPath}`);
  return iwdPath;
}

// this function launches an instruments test with a default test
// that immediately passes. In this way we can start a simulator
// and be notified when it completely launches
async function quickLaunch (udid, appPath = path.resolve(__dirname, '..', '..', 'assets', 'TestApp.app')) {
  let traceTemplatePath = await xcode.getAutomationTraceTemplatePath();
  let scriptPath = path.resolve(__dirname, '..', '..', 'assets', 'blank_instruments_test.js');
  let traceDocument = path.resolve('/', 'tmp', 'testTrace.trace');
  let resultsPath = path.resolve('/', 'tmp');

  // the trace document can be in a weird state
  // but we never do anything with it, so delete
  await fs.rimraf(traceDocument);

  let args = ['instruments',
              '-D', traceDocument,
               '-t', traceTemplatePath,
               '-w', udid,
               appPath,
               '-e', 'UIASCRIPT', scriptPath,
               '-e', 'UIARESULTSPATH', resultsPath];
  log.debug(`Running command: 'xcrun ${args.join(' ')}'`);
  await exec('xcrun', args);
}

async function quickInstruments (opts = {}) {
  opts = _.cloneDeep(opts);
  let xcodeTraceTemplatePath = opts.xcodeTraceTemplatePath ||
      await xcode.getAutomationTraceTemplatePath();
  _.defaults(opts, {
    launchTimeout: 60000,
    template: xcodeTraceTemplatePath,
    withoutDelay: true,
    xcodeVersion: '8.1',
    webSocket: null,
    flakeyRetries: true,
    logNoColors: false,
  });
  return new Instruments(opts);
}

export { rootDir, killAllInstruments, cleanAllTraces, getInstrumentsPath,
         getAvailableDevices, parseLaunchTimeout, getIwdPath, quickLaunch,
         quickInstruments };
