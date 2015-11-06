import setup from "../setup-base";
import env from '../helpers/env';

describe('safari - basics @skip-ios6 @skip-real-device', () => {
  if (!(env.IOS8 || env.IOS9) && env.IOS80) {
    return describe('default init', () => {
      var driver;

      setup(this, {
        browserName: 'safari'
      }).then((d) => driver = d;);

      it('it should use safari default init page', function () {
        (await driver.source()).should.include('Apple');
      });
    });
  }

  describe('default init', () => {
    let driver;

    setup(this, {
      browserName: 'safari'
    }).then((d) => driver = d;);

    it('it should use appium default init page', () => {
      (await driver.source()).should.include('Let\'s browse!');
    });
  });

  describe('init with safariInitialUrl', () => {
    var driver;

    setup(this, {
      browserName: 'safari',
      safariInitialUrl: env.GUINEA_TEST_END_POINT
    }).then((d) => driver = d;);

    it('should go to the requested page', () =>
      (await driver.source()).should.include('I am some page content');
    });
  });
});
