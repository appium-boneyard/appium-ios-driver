import setup from "../setup-base";
import env from '../helpers/env';

describe('safari - basics @skip-real-device', function () {
  if (!(env.IOS8 || env.IOS9) && env.IOS80) {
    return describe('default init', function () {
      const driver = setup(this, { browserName: 'safari' }).driver;

      it('it should use safari default init page', async () => {
        (await driver.getPageSource()).should.include('Apple');
      });
    });
  }

  describe('default init', function () {
    const driver = setup(this, { browserName: 'safari' }).driver;

    it('it should use appium default init page', async () => {
      (await driver.getPageSource()).should.include('Let\'s browse!');
    });
  });

  describe('init with safariInitialUrl', function () {
    const driver = setup(this, {
      browserName: 'safari',
      safariInitialUrl: env.GUINEA_TEST_END_POINT
    }).driver;

    it('should go to the requested page', async () => {
      (await driver.getPageSource()).should.include('I am some page content');
    });
  });
});
