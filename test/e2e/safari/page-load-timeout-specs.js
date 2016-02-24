import setup from "../setup-base";
import env from '../helpers/env';

describe('safari - page load timeout', function() {
  if (!env.IOS81) {
    return;
  }

  describe('small timeout, slow page load', function() {
    const driver = setup(this, { browserName: 'safari' }).driver;

    it('should go to the requested page', async () => {
      await driver.timeouts('page load', 5000);
      await driver.setUrl(env.GUINEA_TEST_END_POINT + '?delay=30000');

      // the page should not have time to load
      (await driver.getPageSource()).should.include('Let\'s browse!');
    });
  });

  describe('no timeout, very slow page', function() {
    let startMs = Date.now();
    const driver = setup(this, { browserName: 'safari' }).driver;

    it('should go to the requested page', async () => {
      await driver.timeouts('command', 120000);
      await driver.timeouts('page load', -1);
      await driver.setUrl(env.GUINEA_TEST_END_POINT + '?delay=70000');

      // the page should load after 70000
      (await driver.getPageSource()).should.include('I am some page content');
      (Date.now() - startMs).should.be.above(70000);
    });
  });
});
