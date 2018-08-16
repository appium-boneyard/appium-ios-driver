// transpile:mocha

import IosDriver from '../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks } from 'appium-test-support';
import * as teen_process from 'teen_process';
import { fs } from 'appium-support';
import xcode from 'appium-xcode';


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
    afterEach(function () {
      mocks.verify();
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
      }).should.eventually.be.rejectedWith(/Appium's IosDriver does not support Xcode version 8.0.0/);
    });
  }));

  describe('timeouts', function () {
    let driver;
    before(async function () {
      driver = new IosDriver();
    });
    describe('command', function () {
      it('should exist by default', async function () {
        driver.newCommandTimeoutMs.should.equal(60000);
      });
      it('should be settable through `timeouts`', async function () {
        await driver.timeouts('command', 20);
        driver.newCommandTimeoutMs.should.equal(20);
      });
    });
    describe('implicit', function () {
      it('should not exist by default', async function () {
        driver.implicitWaitMs.should.equal(0);
      });
      it('should be settable through `timeouts`', async function () {
        await driver.timeouts('implicit', 20);
        driver.implicitWaitMs.should.equal(20);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        await driver.timeouts(undefined, undefined, undefined, undefined, 30);
        driver.implicitWaitMs.should.equal(30);
      });
    });
    describe('page load', function () {
      it('should be settable through `timeouts`', async function () {
        let to = driver.pageLoadMs + 20;
        await driver.timeouts('page load', to);
        driver.pageLoadMs.should.equal(to);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        let to = driver.pageLoadMs + 30;
        await driver.timeouts(undefined, undefined, undefined, to);
        driver.pageLoadMs.should.equal(to);
      });
    });
    describe('script', function () {
      it('should be settable through `timeouts`', async function () {
        let to = driver.asyncWaitMs + 20;
        await driver.timeouts('script', to);
        driver.asyncWaitMs.should.equal(to);
      });
      it('should be settable through `timeouts` for W3C', async function () {
        let to = driver.asyncWaitMs + 30;
        await driver.timeouts(undefined, undefined, to);
        driver.asyncWaitMs.should.equal(to);
      });
      it('should be settable through asyncScriptTimeout', async function () {
        let to = driver.asyncWaitMs + 20;
        await driver.asyncScriptTimeout(to);
        driver.asyncWaitMs.should.equal(to);
      });
    });
    describe('script, page load and implicit', function () {
      it('should be settable through `timeouts` for W3C', async function () {
        await driver.timeouts(undefined, undefined, 10, 20, 30);
        driver.implicitWaitMs.should.equal(30);
        driver.pageLoadMs.should.equal(20);
        driver.asyncWaitMs.should.equal(10);
      });
    });
  });
});

describe('getDeviceTime', withMocks({fs, teen_process}, (mocks) => {
  afterEach(function () {
    mocks.verify();
  });
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
      let date = 'Tue Jun 12 11:13:31 CEST 2018';
      let driver = setup(mocks, {date});
      (await driver.getDeviceTime()).startsWith('2018-06-12T').should.be.true;
    });

    it('should call idevicedate with format', async function () {
      let date = 'Tue Jun 12 11:13:31 CEST 2018';
      let driver = setup(mocks, {date});
      (await driver.getDeviceTime('YYYY-MM-DD')).should.equal('2018-06-12');
    });

    it('should return output of idevicedate if unparseable', async function () {
      let date = 'some time and date';
      let driver = setup(mocks, {date});
      (await driver.getDeviceTime()).should.equal(date);
    });

    it('should throw an error when idevicedate cannot be found', async function () {
      mocks.fs.expects('which')
        .once().throws();
      let driver = new IosDriver();
      driver.opts = {udid: 'some-udid'};
      await driver.getDeviceTime()
        .should.eventually.be.rejectedWith('Could not capture device date and time');
    });
  });

  describe('simulator', function () {
    it('should return system date', async function () {
      mocks.teen_process.expects('exec')
        .once().withExactArgs('date', ['+%Y-%m-%dT%H:%M:%S%z'])
        .returns({stdout: '2018-06-12T12:11:59+0200'});
      let driver = new IosDriver();
      (await driver.getDeviceTime()).startsWith('2018-06-12T').should.be.true;
    });
  });
}));
