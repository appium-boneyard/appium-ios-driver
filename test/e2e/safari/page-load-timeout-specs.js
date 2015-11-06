import setup from "../setup-base";
import env from '../helpers/env';

describe('safari - page load timeout @skip-ios6', () => {
  if (!env.IOS81) {
    return;
  }

  describe('small timeout, slow page load', () => {
    let driver;

    setup(this, {
      browserName: 'safari'
    }).then((d) => driver = d;);

    it('should go to the requested page', () => {
      await driver.setPageLoadTimeout(5000)
      await driver.get(env.GUINEA_TEST_END_POINT + '?delay=30000')

      // the page should not have time to load
      (await driver.source()).should.include('Let\'s browse!');
    });
  });

  describe('no timeout, very slow page', () => {
    let startMs = Date.now();
    let driver;

    setup(this, {
      browserName: 'safari'
    }).then((d) => driver = d;);

    it('should go to the requested page', () => {
      await driver.setCommandTimeout(120000)
      await driver.setPageLoadTimeout(-1)
      await driver.get(env.GUINEA_TEST_END_POINT + '?delay=70000')

      // the page should load after 70000
      (await driver.source()).should.include('I am some page content')
      (Date.now() - startMs).should.be.above(70000);
    });
  });
});
