import { IosDriver } from '../..';
import utils from '../../lib/utils';
import chai from 'chai';
import sinon from 'sinon';
import { withMocks } from 'appium-test-support';
import xcode from 'appium-xcode';

let sandbox = sinon.createSandbox();
const should = chai.Should();

describe('Desired Capabilities', function () {
  let driver;
  before(function () {
    driver = new IosDriver();
  });

  function checkCaps (caps, throws = false) {
    if (throws) {
      should.Throw(function () {
        driver.validateDesiredCaps(caps);
      });
    } else {
      should.not.Throw(function () {
        driver.validateDesiredCaps(caps);
      });
    }
  }

  describe('platform name, app and bundleId', function () {
    it('should throw error if neither app nor bundleId are present', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5'
      };
      checkCaps(caps, true);
    });
    it('should accept an app', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app'
      };
      checkCaps(caps);
    });
    it('should accept a bundleId', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        bundleId: 'com.some-company.some-app'
      };
      checkCaps(caps);
    });
    it('should not be sensitive to platform name casing', function () {
      let caps = {
        platformName: 'IoS',
        deviceName: 'iPhone 5',
        bundleId: 'com.some-company.some-app'
      };
      checkCaps(caps);
    });
  });

  describe('launchTimeout', function () {
    it('should accept a number', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: 1
      };
      checkCaps(caps);
    });
    it('should accept an object', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: {
          global: 1
        }
      };
      checkCaps(caps);
    });
    it('should accept a stringified object', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: JSON.stringify({
          global: 1
        })
      };
      checkCaps(caps);
    });
    it('should fail for non-JSON string', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: 'launch timeout!'
      };
      checkCaps(caps, true);
    });
  });

  describe('processArguments', function () {
    it('should accept plain string', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        processArguments: 'this is a process argument'
      };
      checkCaps(caps);
    });
    it('should accept an object', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        processArguments: {
          global: 1
        }
      };
      checkCaps(caps);
    });
    it('should accept a stringified object', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        processArguments: JSON.stringify({
          global: 1
        })
      };
      checkCaps(caps);
    });
    it('should fail for non-string, non-object', function () {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        processArguments: 4
      };
      checkCaps(caps, true);
    });
  });

  describe('server capabilities', withMocks({xcode}, (mocks) => {
    it('should collect server capabilities', async function () {
      mocks.xcode.expects('getVersion')
        .once().returns({
          versionString: '7.0.0',
          versionFloat: 7.0,
          major: 7,
          minor: 0,
          patch: 0
        });

      sandbox.stub(driver, 'configureApp');
      sandbox.stub(driver, 'validateDesiredCaps');
      sandbox.stub(driver, 'start');
      sandbox.stub(driver, 'startNewCommandTimeout');
      sandbox.stub(utils, 'detectUdid');
      sandbox.stub(utils, 'prepareIosOpts');
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app'
      };
      await driver.createSession(caps);
      driver.caps.takesScreenshot.should.exist;
      sandbox.restore();
    });
  }));
});
