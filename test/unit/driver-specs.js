// transpile:mocha

import IosDriver from '../..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks } from 'appium-test-support';
import * as teen_process from 'teen_process';
import { fs } from 'appium-support';
import xcode from 'appium-xcode';
import sinon from 'sinon';
import request from 'request-promise';

let expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);

describe('driver', () => {
  it('should instantiate class', () => {
    let driver = new IosDriver();
    driver.should.exist;
  });

  describe('unsupported infrastructure', withMocks({xcode}, (mocks) => {
    let driver;
    before(async () => {
      driver = new IosDriver();
    });
    it('should throw an error for Xcode version 8+', async () => {
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

  describe('timeouts', () => {
    let driver;
    before(async () => {
      driver = new IosDriver();
      // await driver.createSession({});
    });
    describe('command', () => {
      it('should exist by default', async () => {
        driver.newCommandTimeoutMs.should.equal(60000);
      });
      it('should be settable through `timeouts`', async () => {
        await driver.timeouts('command', 20);
        driver.newCommandTimeoutMs.should.equal(20);
      });
    });
    describe('implicit', () => {
      it('should not exist by default', async () => {
        driver.implicitWaitMs.should.equal(0);
      });
      it('should be settable through `timeouts`', async () => {
        await driver.timeouts('implicit', 20);
        driver.implicitWaitMs.should.equal(20);
      });
    });
    describe('page load', () => {
      it('should be settable through `timeouts`', async () => {
        let to = driver.pageLoadMs;
        await driver.timeouts('page load', to + 20);
        driver.pageLoadMs.should.equal(to + 20);
      });
    });
    describe('script', () => {
      it('should be settable through `timeouts`', async () => {
        let to = driver.asyncWaitMs;
        await driver.timeouts('script', to + 20);
        driver.asyncWaitMs.should.equal(to + 20);
      });
      it('should be settable through asyncScriptTimeout', async () => {
        let to = driver.asyncWaitMs;
        await driver.asyncScriptTimeout(to + 20);
        driver.asyncWaitMs.should.equal(to + 20);
      });
    });
  });

  describe('IWDP runner', async () => {
    let driver, stub;

    beforeEach(() => {
      driver = new IosDriver();
      stub = sinon.stub(driver, 'isRealDevice', () => true);
    });

    afterEach(() => {
      stub.restore();
    });

    it('should not start IWDP server if startIWDP !== true', async () => {
      await driver.startIWDP();
      expect(driver.iwdpServer).to.be.undefined;
      await driver.stopIWDP();
    });

    it('should start IWDP server if "startIWDP=true" and then close it when stopIWDP is called', async () => {
      driver.opts.startIWDP = true;
      await driver.startIWDP();
      let endpoint = driver.iwdpServer.endpoint;
      await request(endpoint).should.eventually.have.string('<html');
      await driver.stopIWDP();
      await request(endpoint).should.eventually.be.rejected;
      expect(driver.iwdpServer).to.be.undefined;
    });

    it('should start IWDP server at the port specified in opts.webkitDebugProxyPort', async () => {
      driver.opts.webkitDebugProxyPort = 56789;
      driver.opts.startIWDP = true;
      await driver.startIWDP();
      let endpoint = driver.iwdpServer.endpoint;
      endpoint.should.have.string('56789');
      await request(endpoint).should.eventually.have.string('<html');
      await driver.stopIWDP();
      await request(endpoint).should.eventually.be.rejected;
      expect(driver.iwdpServer).to.be.undefined;
    });
  });
});

describe('getDeviceTime', withMocks({fs, teen_process}, (mocks) => {
  it('should call idevicedate on real device', async () => {
    let udid = 'some-udid';
    let date = new Date().toString();
    let idevicedatePath = '/path/to/idevicedate';
    mocks.fs.expects('which')
      .once().returns(idevicedatePath);
    mocks.teen_process.expects('exec')
      .once().withExactArgs(idevicedatePath, ['-u', udid])
      .returns({stdout: date});
    let driver = new IosDriver();
    driver.opts = {udid};

    (await driver.getDeviceTime()).should.equal(date);

    mocks.fs.verify();
    mocks.teen_process.verify();
  });

  it('should throw an error when idevicedate cannot be found', async () => {
    let udid = 'some-udid';
    mocks.fs.expects('which')
      .once().throws();
    let driver = new IosDriver();
    driver.opts = {udid};
    await driver.getDeviceTime()
      .should.eventually.be.rejectedWith("Could not capture device date and time");

    mocks.fs.verify();
  });

  it('should throw an error when idevicedate fails', async () => {
    let udid = 'some-udid';
    let idevicedatePath = '/path/to/idevicedate';
    mocks.fs.expects('which')
      .once().returns(idevicedatePath);
    mocks.teen_process.expects("exec")
      .once().withExactArgs(idevicedatePath, ['-u', udid])
      .throws("ENOENT");
    let driver = new IosDriver();
    driver.opts = {udid};
    await driver.getDeviceTime()
      .should.eventually.be.rejectedWith("Could not capture device date and time");

    mocks.fs.verify();
    mocks.teen_process.verify();
  });

  it('should return system date on simulator', async () => {
    mocks.teen_process.expects("exec")
      .never();
    let driver = new IosDriver();
    (await driver.getDeviceTime()).should.be.an instanceof(String);

    mocks.teen_process.verify();
  });
}));
