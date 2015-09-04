import { IosDriver } from '../..';
import chai from 'chai';


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

  describe('app and bundleId', () => {
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
});
