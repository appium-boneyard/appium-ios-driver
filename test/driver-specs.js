// transpile:mocha

import IosDriver from '../';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks } from 'appium-test-support';
import * as teen_process from 'teen_process';
import { fs } from 'appium-support';

chai.should();
chai.use(chaiAsPromised);

describe('driver', () => {
  it('should instantiate class', () => {
    let driver = new IosDriver();
    driver.should.exist;
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
