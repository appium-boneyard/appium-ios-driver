import desired from './desired';
import setup from '../../setup-base';
import env from '../../helpers/env';
import { loadWebView, spinWait } from '../../helpers/webview';

describe('safari - webview - special capabilities', function() {
  let specialCaps = Object.assign({}, desired);
  specialCaps.safariIgnoreFraudWarning = true;

  const driver = setup(this, specialCaps, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(specialCaps, driver));

  // iOS8 currently does not disable the phishing warning for foo:bar@ type
  // addresses, even when running the sim manually
  // TODO: find another way to trigger the phishing warning that IS disabled
  // by the pref on iOS8
  it('should not display a phishing warning with safariIgnoreFraudWarning @skip-ios8', async () => {
    await driver.setUrl(env.PHISHING_END_POINT + 'guinea-pig2.html');
    await spinWait(async () => {
      (await driver.getTitle()).should.contain("I am another page title");
    });
  });
});
