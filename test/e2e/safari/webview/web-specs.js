import { IosDriver } from '../../../../lib/driver';
import { util } from 'appium-support';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.should();
chai.use(chaiAsPromised);

describe('Web', function () {
  let driver;
  beforeEach(function () {
    driver = new IosDriver();
  });
  describe('.convertElementsForAtoms', function () {
    it('should not alter primitives', function () {
      let primitives = ['hello', 1, true];
      driver.convertElementsForAtoms(primitives).should.eql(primitives);
    });
    it('should parse W3C and MJSONWP element ids', function () {
      for (const elType of ['ELEMENT', util.W3C_WEB_ELEMENT_IDENTIFIER]) {
        driver.webElementIds = [123];
        const args = [{
          [elType]: 5000
        }];
        driver.convertElementsForAtoms(args).should.eql([{ELEMENT: 123}]);
      }
    });
  });
});
