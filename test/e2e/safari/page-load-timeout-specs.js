import setup from "../setup-base";
import env from '../helpers/env';
import { MOCHA_SAFARI_TIMEOUT } from '../helpers/session';


// TODO: fix page load handling in appium-remote-debugger
// right now it is not respected, so we need to skip
describe.skip('safari - page load timeout', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  const driver = setup(this, {
    browserName: 'safari',
    fullReset: true,
  }).driver;

  describe('small timeout, slow page load', function () {
    it('should not go to the requested page', async () => {
      await driver.timeouts('page load', 5000);
      await driver.setUrl(env.GUINEA_TEST_END_POINT + '?delay=30000');

      // the page should not have time to load
      (await driver.getPageSource()).should.include('Let\'s browse!');
    });
  });

  describe('no timeout, very slow page', function () {
    let startMs = Date.now();

    it('should go to the requested page', async () => {
      await driver.timeouts('command', 120000);
      await driver.timeouts('page load', 0);
      await driver.setUrl(env.GUINEA_TEST_END_POINT + '?delay=5000');

      // the page should load after 70000
      (await driver.getPageSource()).should.include('I am some page content');
      (Date.now() - startMs).should.be.above(5000);
    });
  });
});
