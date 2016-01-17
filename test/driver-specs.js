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
    it('should return a valid date string', async () => {
      let udid = 'some-udid';
      let date = new Date().toString();
      mocks.fs.expects('which')
        .once().returns('/path/to/idevicedate');
      mocks.teen_process.expects('exec')
        .once().withExactArgs('idevicedate', ['-u', udid])
        .returns({stdout: date});
      let driver = new IosDriver();
      driver.opts = {udid};

      (await driver.getDeviceTime()).should.equal(date);
    });

    it('should not capture device date and time', async () => {
      let udid = 'some-udid';
      mocks.teen_process.expects("exec")
        .once()
        .throws("ENOENT");
      let driver = new IosDriver();
      driver.opts = {udid};
      await driver.getDeviceTime()
        .should.eventually.be.rejectedWith("Could not capture device date and time");
    });
}));
