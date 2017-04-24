// transpile:mocha

import { Instruments, instrumentsUtils } from '../../../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import _ from 'lodash';
import { killAllSimulators } from 'appium-ios-simulator';
import { fs } from 'appium-support';
import { exec } from 'teen_process';
import { retry } from 'asyncbox';

chai.should();
chai.use(chaiAsPromised);

var LAUNCH_HANDLER_TIMEOUT = 10000;
var TEMP_DIR = path.resolve(__dirname, 'tmp');

describe('instruments tests', function () {
  this.timeout(90000);

  async function newInstrument (opts) {
    _.extend(opts, {
      app: path.resolve(__dirname, '..', '..', '..', 'assets', 'TestApp.app'),
      bootstrap: path.resolve(__dirname, '..', 'assets', 'bootstrap.js'),
      simulatorSdkAndDevice: 'iPhone 6 (9.3)'
    });
    return await Instruments.quickInstruments(opts);
  }

  function test (appendDesc, opts, checks = {}) {
    checks = checks || {};
    let instruments;

    it(`should launch${appendDesc}`, async () => {
      await killAllSimulators();
      instruments = await newInstrument(opts);
      if (checks.afterCreate) {
        await checks.afterCreate(instruments);
      }
      setTimeout(function () {
        if (instruments.launchResultDeferred) {
          instruments.launchResultDeferred.resolve();
        }
      }, LAUNCH_HANDLER_TIMEOUT);
      await instruments.launch();
      if (checks.afterLaunch) {
        await checks.afterLaunch(instruments);
      }
    });

    it(`should shutdown${appendDesc}`, async function () {
      await instruments.shutdown();
    });
  }

  describe('regular timeout', function () {
    test('', {launchTimeout: 60000});
  });

  describe('smart timeout', function () {
    test('', {launchTimeout: {global: 60000, afterSimLaunch: 10000}});
  });

  describe.skip("using different tmp dir", function () {
    let altTmpDir = path.resolve(TEMP_DIR, 'abcd');

    before(async function () {
      // travis can't write to /tmp, so let's create a tmp directory
      try {
        await fs.mkdir(TEMP_DIR);
      } catch (e) {}

      await fs.rimraf(altTmpDir);
    });

    after(async function () {
      await fs.rimraf(TEMP_DIR);
    });

    test(" (1)", {
      launchTimeout: {global: 60000, afterSimLaunch: 10000},
      tmpDir: altTmpDir
    }, {
      afterCreate: (instruments) => { instruments.tmpDir.should.equal(altTmpDir); },
      afterLaunch: async () => {
        (await fs.exists(altTmpDir)).should.be.ok;
        (await fs.exists(path.resolve(altTmpDir, 'instrumentscli0.trace'))).should.be.ok;
      }
    });

    //test(" (2)", {
      //launchTimeout: {global: 60000, afterSimLaunch: 10000},
      //tmpDir: altTmpDir
    //}, {
      //afterCreate: function (instruments) { instruments.tmpDir.should.equal(altTmpDir); },
      //afterLaunch: async function () {
        //(await fs.exists(altTmpDir)).should.be.ok;
        //// tmp dir is deleted at startup so trace file is not incremented
        //(await fs.exists(path.resolve(altTmpDir, 'instrumentscli0.trace'))).should.be.ok;
      //}
    //});
  });

  describe.skip("using different trace dir", function () {
    let altTraceDir = path.resolve(TEMP_DIR, 'abcd');

    before(async function () {
      // travis can't write to /tmp, so let's create a tmp directory
      try {
        await fs.mkdir(TEMP_DIR);
      } catch (e) {}

      await fs.rimraf(altTraceDir);
    });

    after(async function () {
      await fs.rimraf(TEMP_DIR);
    });

    test(" (1)", {
      launchTimeout: {global: 60000, afterSimLaunch: 10000},
      traceDir: altTraceDir
    }, {
      afterCreate: (instruments) => {
        instruments.tmpDir.should.equal('/tmp/appium-instruments');
      },
      afterLaunch: async () => {
        (await fs.exists(altTraceDir)).should.be.ok;
        (await fs.exists(path.resolve(altTraceDir, 'instrumentscli0.trace')))
          .should.be.ok;
      }
    });

    test(" (2)", {
      launchTimeout: {global: 60000, afterSimLaunch: 10000},
      traceDir: altTraceDir
    }, {
      afterCreate: (instruments) => {
        instruments.tmpDir.should.equal('/tmp/appium-instruments');
      },
      afterLaunch: async () => {
        (await fs.exists(altTraceDir)).should.be.ok;
        (await fs.exists(path.resolve(altTraceDir, 'instrumentscli1.trace')))
          .should.be.ok;
      }
    });
  });

  describe("shutdown without startup", function () {
    it('should launch', async function () {
      await killAllSimulators();
      let instruments = await newInstrument({launchTimeout: 60000});
      await instruments.shutdown();
    });
  });

  describe('getting devices', function () {
    before(async () => {
      await killAllSimulators();
    });

    it('should get all available devices', async function () {
      let iosVer;
      try {
        let {stdout} = await exec('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']);
        iosVer = parseFloat(stdout);
      } catch (ign) {}
      if (_.isNumber(iosVer) || isNaN(iosVer)) {
        console.warn('Could not get iOS sdk version, skipping test'); // eslint-disable-line no-console
        this.skip();
      }
      let devices = await retry(3, instrumentsUtils.getAvailableDevices);
      if (iosVer >= 7.1) {
        devices.length.should.be.above(0);
        devices.join('\n').should.include('iPhone 6 (8.4');
      } else {
        devices.length.should.equal(0);
      }
    });
  });
});
