import IosDriver from '../../..';
import chai from 'chai';
import _ from 'lodash';


chai.should();

describe('logging -', function () {
  let driver;
  before(function () {
    driver = new IosDriver();
  });
  describe('getLogTypes', function () {
    it('should respond to the command', function () {
      driver.getLogTypes.should.an.instanceof(Function);
    });
    it('should get the list of available logs', async function () {
      const types = await driver.getLogTypes();
      _.xor(['syslog', 'crashlog', 'performance', 'server'], types).should.eql([]);
    });
  });
  describe('getLog', function () {
    it('should respond to the command', function () {
      driver.getLog.should.be.an.instanceof(Function);
    });
    // unit tests of getLog are in `appium-base-driver`
  });
});
