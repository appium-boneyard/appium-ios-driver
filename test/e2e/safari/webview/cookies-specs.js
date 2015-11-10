import desired from './desired';
import setup from '../setup-base';
import { loadWebView, isChrome, testEndpoint, ignoreEncodingBug } from '../helpers/webview';

describe('safari - webview - cookies @skip-ios6', () => {
  const driver = await setup(this, desired, {'no-reset': true});

  describe('within iframe webview', () => {
    it('should be able to get cookies for a page with none', () => {
      await loadWebView(desired, driver, testEndpoint(desired) + 'iframes.html', 'Iframe guinea pig');
      await driver.deleteAllCookies();
      await driver.get(testEndpoint(desired));
      (await driver.allCookies()).should.have.length(0);
    });
  });

  describe('within webview', () => {
    beforeEach(() => await loadWebView(desired, driver););

    it('should be able to get cookies for a page', () => {
      let cookies = await driver.allCookies();
      cookies.length.should.equal(2);
      cookies[0].name.should.equal('guineacookie1');
      cookies[0].value.should.equal(ignoreEncodingBug('i am a cookie value'));
      cookies[1].name.should.equal('guineacookie2');
      cookies[1].value.should.equal(ignoreEncodingBug('cookié2'));
    });

    it('should be able to set a cookie for a page', () => {
      let newCookie = {
        name: `newcookie`,
        value: `i'm new here`
      };

      await driver.deleteCookie(newCookie.name);
      let cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);

      await driver.setCookie(newCookie);
      cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.include(newCookie.name);
      cookies.map((c) => c.value).should.include(newCookie.value);
      // should not clobber old cookies
      cookies.map((c) => c.name).should.include('guineacookie1');
      cookies.map((c) => c.value).should.include(ignoreEncodingBug('i am a cookie value'));
    });

    it('should be able to set a cookie with expiry', () => {
      let newCookie = {
        name: `newcookie`,
        value: `i'm new here`
      };
      newCookie.expiry = parseInt(Date.now() / 1000, 10) - 1000; // set cookie in past

      await driver.deleteCookie(newCookie.name);
      let cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);

      await driver.setCookie(newCookie);
      cookies = await driver.allCookies();
      // should not include cookie we just added because of expiry
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);
      // should not clobber old cookies
      cookies.map((c) => c.name).should.include('guineacookie1');
      cookies.map((c) => c.value).should.include(ignoreEncodingBug('i am a cookie value'));
    });

    it('should be able to delete one cookie', () => {
      var newCookie = {
        name: `newcookie`,
        value: `i'm new here`
      };

      await driver.deleteCookie(newCookie.name);
      let cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);

      await driver.setCookie(newCookie);
      cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.include(newCookie.name);
      cookies.map((c) => c.value).should.include(newCookie.value);

      await driver.deleteCookie('newcookie');
      cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);
    });

    it('should be able to delete all cookie', () => {
      let newCookie = {
        name: `newcookie`,
        value: `i'm new here`
      };

      await driver.deleteCookie(newCookie.name);
      let cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.not.include(newCookie.name);
      cookies.map((c) => c.value).should.not.include(newCookie.value);

      await driver.setCookie(newCookie);
      cookies = await driver.allCookies();
      cookies.map((c) => c.name).should.include(newCookie.name);
      cookies.map((c) => c.value).should.include(newCookie.value);

      await driver.deleteAllCookies();
      cookies = await driver.allCookies();
      cookies.length.should.equal(0);
    });
  });
});
