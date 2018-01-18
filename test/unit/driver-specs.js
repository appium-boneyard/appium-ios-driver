// transpile:mocha

import IosDriver from '../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks } from 'appium-test-support';
import * as teen_process from 'teen_process';
import { fs } from 'appium-support';
import xcode from 'appium-xcode';
import {BaseDriver} from "appium-base-driver";

chai.should();
chai.use(chaiAsPromised);

describe('driver', function () {
  it('should instantiate class', function () {
    let driver = new IosDriver();
    driver.should.exist;
  });

  describe('unsupported infrastructure', withMocks({xcode}, (mocks) => {
    let driver;
    before(async function () {
      driver = new IosDriver();
    });
    it('should throw an error for Xcode version 8+', async function () {
      mocks.xcode.expects('getVersion')
        .once().returns({
          versionString: '8.0.0',
          versionFloat: 8.0,
          major: 8,
          minor: 0,
          patch: 0
        });
      await driver.createSession({
        platformName: 'iOS',
        deviceName: 'iPhone Simulator',
        app: '/path/to/app'
      }).should.eventually.be.rejectedWith(/Appium's IosDriver does not support xcode version 8.0.0/);
      mocks.xcode.verify();
    });
  }));

  describe('timeouts', function () {
    let driver;
    before(async function () {
      driver = new IosDriver();
      // await driver.createSession({});
    });
    describe('command', function () {
      it('should exist by default', async function () {
        driver.newCommandTimeoutMs.should.equal(60000);
      });
      it('should be settable through `timeouts`', async function () {
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.MJSONWP, type: 'command', ms: 20}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.newCommandTimeoutMs.should.equal(20);
      });
      it('should not be settable through `timeouts` for W3C', async function () {
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.W3C, command: 3000}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.newCommandTimeoutMs.should.equal(20);
      });
    });
    describe('implicit', function () {
      it('should not exist by default', async function () {
        driver.implicitWaitMs.should.equal(0);
      });
      it('should be settable through `timeouts`', async function () {
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.MJSONWP, type: 'implicit', ms: 20}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.implicitWaitMs.should.equal(20);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.W3C, implicit: 30}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.implicitWaitMs.should.equal(30);
      });
    });
    describe('page load', function () {
      it('should be settable through `timeouts`', async function () {
        let to = driver.pageLoadMs;
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.MJSONWP, type: 'page load', ms: to + 20}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.pageLoadMs.should.equal(to + 20);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        let to = driver.pageLoadMs;
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.W3C, pageLoad: to + 30}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.pageLoadMs.should.equal(to + 30);
      });
    });
    describe('script', function () {
      it('should be settable through `timeouts`', async function () {
        let to = driver.asyncWaitMs;
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.MJSONWP, type: 'script', ms: to + 20}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.asyncWaitMs.should.equal(to + 20);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        let to = driver.asyncWaitMs;
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.W3C, script: to + 30}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.asyncWaitMs.should.equal(to + 30);
      });
      it('should be settable through asyncScriptTimeout', async function () {
        let to = driver.asyncWaitMs;
        await driver.asyncScriptTimeout(to + 20);
        driver.asyncWaitMs.should.equal(to + 20);
      });
    });
    describe('script, page load and implicit', function () {
      it('should be settable through `timeouts` for W3C', async function () {
        let to = driver.asyncWaitMs;
        await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.W3C, implicit: 20, pageLoad: to + 20, script: to + 30}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
        driver.implicitWaitMs.should.equal(20);
        driver.pageLoadMs.should.equal(to + 20);
        driver.asyncWaitMs.should.equal(to + 30);
      });
    });
  });
});

describe('getDeviceTime', withMocks({fs, teen_process}, (mocks) => {
  describe('real device', function () {
    const setup = function (mocks, opts = {}) {
      let udid = 'some-udid';
      let idevicedatePath = '/path/to/idevicedate';
      mocks.fs.expects('which')
        .once().returns(idevicedatePath);
      if (opts.date) {
        mocks.teen_process.expects('exec')
          .once().withExactArgs(idevicedatePath, ['-u', udid])
          .returns({stdout: opts.date});
      } else {
        mocks.teen_process.expects('exec')
          .once().withExactArgs(idevicedatePath, ['-u', udid])
          .throws('ENOENT');
      }
      let driver = new IosDriver();
      driver.opts = {udid};

      return driver;
    };

    it('should call idevicedate', async function () {
      let date = new Date().toString();
      let driver = setup(mocks, {date});
      (await driver.getDeviceTime()).should.equal(date);

      mocks.fs.verify();
      mocks.teen_process.verify();
    });

    it('should return output of idevicedate if unparseable', async function () {
      let date = 'some time and date';
      let driver = setup(mocks, {date});
      (await driver.getDeviceTime()).should.equal(date);

      mocks.fs.verify();
      mocks.teen_process.verify();
    });

    it('should throw an error when idevicedate cannot be found', async function () {
      mocks.fs.expects('which')
        .once().throws();
      let driver = new IosDriver();
      driver.opts = {udid: 'some-udid'};
      await driver.getDeviceTime()
        .should.eventually.be.rejectedWith('Could not capture device date and time');

      mocks.fs.verify();
    });

    it('should throw an error when idevicedate fails', async function () {
      let driver = setup(mocks);
      await driver.getDeviceTime()
        .should.eventually.be.rejectedWith("Could not capture device date and time");

      mocks.fs.verify();
      mocks.teen_process.verify();
    });
  });

  describe('simulator', function () {
    it('should return system date', async function () {
      mocks.teen_process.expects('exec')
        .never();
      let driver = new IosDriver();
      (await driver.getDeviceTime()).should.be.an instanceof(String);

      mocks.teen_process.verify();
    });
  });
}));
