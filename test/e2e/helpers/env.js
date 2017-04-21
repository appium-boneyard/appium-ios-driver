import path from 'path';
import { util } from 'appium-support';


let localIp = util.localIp;

let env = {};

env.IMPLICIT_WAIT_TIMEOUT = 5000;

env.PLATFORM_VERSION = process.env.PLATFORM_VERSION;

env.VERBOSE = process.env.VERBOSE;
if (env.VERBOSE) console.log("process.env.LAUNCH_TIMEOUT -->", process.env.LAUNCH_TIMEOUT); //eslint-disable-line no-console
env.LAUNCH_TIMEOUT = JSON.parse(process.env.LAUNCH_TIMEOUT || 60000);
env.MOCHA_INIT_TIMEOUT = parseInt(process.env.MOCHA_INIT_TIMEOUT || 300000, 10);

// real device or emulator
env.REAL_DEVICE = process.env.REAL_DEVICE;
env.EMU = !env.REAL_DEVICE;

// device selection
env.DEVICE = (process.env.DEVICE || 'ios93').toLowerCase();

function iphoneOrIpadSimulator (device, version) {
  let isIpad = device.match(/ipad/i);
  switch (version) {
    case '6.1':
    case '7.0':
    case '7.1':
      return isIpad ? 'iPad 2' : 'iPhone 5s';
    case '8.0':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '8.1':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '8.2':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '8.3':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '8.4':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '9.0':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '9.1':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '9.2':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    case '9.3':
      return isIpad ? 'iPad 2' : 'iPhone 6';
    default:
      throw new Error("invalid version");
  }
}

// set up the default capabilities
env.CAPS = {
  browserName: '',
  app: process.env.APP ? path.resolve(__dirname, `../../sample-code/apps/${process.env.APP}/build/Release-iphonesimulator/${process.env.APP}.app`) : ''
};
switch (env.DEVICE) {
  case 'ios6':
  case 'ios6_iphone':
  case 'ios6_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "6.1");
    break;
  case 'ios7':
  case 'ios7_iphone':
  case 'ios7_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "7.0");
    break;
  case 'ios71':
  case 'ios71_iphone':
  case 'ios71_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "7.1");
    break;
  case 'ios8':
  case 'ios80':
  case 'ios8_iphone':
  case 'ios8_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "8.0");
    break;
  case 'ios81':
  case 'ios81_iphone':
  case 'ios81_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "8.1");
    break;
  case 'ios82':
  case 'ios82_iphone':
  case 'ios82_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "8.2");
    break;
  case 'ios83':
  case 'ios83_iphone':
  case 'ios83_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "8.3");
    break;
  case 'ios84':
  case 'ios84_iphone':
  case 'ios84_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "8.4");
    break;
  case 'ios9':
  case 'ios9_iphone':
  case 'ios9_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "9.0");
    break;
  case 'ios91':
  case 'ios91_iphone':
  case 'ios91_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "9.1");
    break;
  case 'ios': // default. move as versions go up
  case 'ios92':
  case 'ios92_iphone':
  case 'ios92_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "9.2");
    break;
  case 'ios93':
  case 'ios93_iphone':
  case 'ios93_ipad':
    env.CAPS.deviceName = iphoneOrIpadSimulator(env.DEVICE, "9.3");
    break;
  default:
    throw new Error('Unknown device!!!');
}

env.IOS6 = env.DEVICE.match(/ios6/i);
env.IOS7 = env.DEVICE.match(/ios7/i);
env.IOS71 = env.DEVICE.match(/ios71/i);
env.IOS8 = env.DEVICE.match(/ios8/i);
env.IOS80 = env.DEVICE.match(/ios80/i);
env.IOS81 = env.DEVICE.match(/ios81/i);
env.IOS82 = env.DEVICE.match(/ios82/i);
env.IOS83 = env.DEVICE.match(/ios83/i);
env.IOS84 = env.DEVICE.match(/ios84/i);
env.IOS9 = env.DEVICE.match(/ios9/i);
env.IOS91 = env.DEVICE.match(/ios91/i);
env.IOS92 = env.DEVICE.match(/ios92/i);
env.IOS93 = env.DEVICE.match(/ios93/i);

// better timeout settings for 71
env.LAUNCH_TIMEOUT =  process.env.LAUNCH_TIMEOUT ? JSON.parse(process.env.LAUNCH_TIMEOUT) :
  ((env.IOS71 || env.IOS8 || env.IOS9) ? {"global": 60000, "afterSimLaunch": 10000} : 60000);

env.CAPS.launchTimeout = env.LAUNCH_TIMEOUT;

env.CAPS.platformName = "iOS";

if (env.REAL_DEVICE) {
  env.CAPS.udid = "auto";
}

if (process.env.UDID) {
  env.CAPS.udid = process.env.UDID;
}

if (env.PLATFORM_VERSION) {
  env.CAPS.platformVersion = env.PLATFORM_VERSION;
} else if (env.IOS6) {
  env.CAPS.platformVersion = "6.1";
} else if (env.IOS71) {
  env.CAPS.platformVersion = "7.1";
} else if (env.IOS7) {
  env.CAPS.platformVersion = "7.0";
} else if (env.IOS81) {
  env.CAPS.platformVersion = "8.1";
} else if (env.IOS82) {
  env.CAPS.platformVersion = "8.2";
} else if (env.IOS83) {
  env.CAPS.platformVersion = "8.3";
} else if (env.IOS84) {
  env.CAPS.platformVersion = "8.4";
} else if (env.IOS8) {
  env.CAPS.platformVersion = "8.0";
} else if (env.IOS91) {
  env.CAPS.platformVersion = "9.1";
} else if (env.IOS92) {
  env.CAPS.platformVersion = "9.2";
} else if (env.IOS93) {
  env.CAPS.platformVersion = "9.3";
} else if (env.IOS9) {
  env.CAPS.platformVersion = "9.0";
}

// max retry
if (process.env.MAX_RETRY) env.MAX_RETRY = parseInt(process.env.MAX_RETRY, 10);

env.APPIUM_PORT = parseInt(process.env.APPIUM_PORT || 4723, 10);
env.LOCAL_APPIUM_PORT = env.SAUCE ? 4443 : env.APPIUM_PORT;
if (env.REAL_DEVICE) {
  env.TEST_END_POINT = `http://${localIp()}:${env.LOCAL_APPIUM_PORT}/test/`;
} else {
  env.TEST_END_POINT = `http://localhost:${env.LOCAL_APPIUM_PORT}/test/`;
}
env.GUINEA_TEST_END_POINT = env.TEST_END_POINT + 'guinea-pig';
env.PHISHING_END_POINT = env.TEST_END_POINT.replace('http://', 'http://foo:bar@');

export default env;
