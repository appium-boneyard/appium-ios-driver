import setup from "../../setup-base";
import desired from '../desired';

describe('uicatalog - gestures - mobile shake @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should not error', async () => {
    await driver.mobileShake();
  });

});

