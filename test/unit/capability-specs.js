import { IosDriver } from '../..';
import utils from '../../lib/utils';
import chai from 'chai';
import sinon from 'sinon';
import { withMocks } from 'appium-test-support';
import xcode from 'appium-xcode';

let sandbox = sinon.sandbox.create();
const should = chai.Should();

describe('Desired Capabilities', () => {
  let driver;
  before(() => {
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

  describe('platform name, app and bundleId', () => {
    it('should throw error if neither app nor bundleId are present', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5'
      };
      checkCaps(caps, true);
    });
    it('should accept an app', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app'
      };
      checkCaps(caps);
    });
    it('should accept a bundleId', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        bundleId: 'com.some-company.some-app'
      };
      checkCaps(caps);
    });
    it('should not be sensitive to platform name casing', () => {
      let caps = {
        platformName: 'IoS',
        deviceName: 'iPhone 5',
        bundleId: 'com.some-company.some-app'
      };
      checkCaps(caps);
    });
  });

  describe('launchTimeout', () => {
    it('should accept a number', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: 1
      };
      checkCaps(caps);
    });
    it('should accept an object', () => {
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
    it('should accept a stringified object', () => {
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
    it('should fail for non-JSON string', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        launchTimeout: 'launch timeout!'
      };
      checkCaps(caps, true);
    });
  });

  describe('processArguments', () => {
    it('should accept plain string', () => {
      let caps = {
        platformName: 'iOS',
        deviceName: 'iPhone 5',
        app: 'some-app',
        processArguments: 'this is a process argument'
      };
      checkCaps(caps);
    });
    it('should accept an object', () => {
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
    it('should accept a stringified object', () => {
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
    it('should fail for non-string, non-object', () => {
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
    it('should collect server capabilities', async () => {
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
