import { instrumentsUtils } from '../../../..';
import chai from 'chai';

chai.should();

describe('utils', function () {
  this.timeout(90000);

  describe('quickLaunch', () => {
    it.skip('should terminate', async () => {
      await instrumentsUtils.quickLaunch("iPhone 6 (8.4 Simulator)");
    });
  });
});
