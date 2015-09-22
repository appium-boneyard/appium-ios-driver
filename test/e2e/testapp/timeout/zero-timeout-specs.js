import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import env from '../../helpers/env';

describe('testapp - timeout', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  afterEach(async () => { await B.delay(3000); });

  describe('zero timeout', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    it('when set to 0 should disable itself', async () => {
      await driver.timeouts('command', 0);
      await B.delay(3000);
      let el = driver.findElement('class name', 'UIAButton');
      el.should.exist;
    });
  });
});
