import setup from "../setup-base";
import desired from './desired';

describe('testapp - deeplink', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should successfully open the URL', async () => {
    await driver.setUrl('testapp://');
  });
});
