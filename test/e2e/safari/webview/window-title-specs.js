import desired from './desired';
import setup from '../../setup-base';
import { loadWebView, isChrome } from '../helpers/webview';

describe("safari - webview - window title @skip-ios6", function () {
  const driver = setup(this, desired, {'no-reset': true});
  beforeEach(async () => await loadWebView(desired, driver));

  it('should return a valid title on web view', async () => {
    (await driver.title()).should.include("I am a page title");

    if (isChrome(desired)) {
      return;
    }

    (await driver.context('NATIVE_APP').title()).should.be.rejectedWith(/status: 13/);
  });
});