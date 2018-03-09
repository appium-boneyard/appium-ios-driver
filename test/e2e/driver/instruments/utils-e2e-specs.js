import { instrumentsUtils } from '../../../..';
import chai from 'chai';

chai.should();

describe('utils', function () {
  this.timeout(90000);

  describe('quickLaunch', function () {
    it.skip('should terminate', async function () {
      await instrumentsUtils.quickLaunch("iPhone 6 (8.4 Simulator)");
    });
  });
});
