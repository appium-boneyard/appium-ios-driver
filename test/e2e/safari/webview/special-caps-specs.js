import desired from './desired';
import setup from '../../setup-base';
import env from '../../helpers/env';
import { loadWebView } from '../helpers/webview';
import { ChaiAsserter } from '../helpers/asserter';

describe('safari - webview - special capabilities @skip-ios6', () => {
  let specialCaps = Object.assign({}, desired);
  specialCaps.safariIgnoreFraudWarning = true;

  const driver = setup(this, specialCaps, {'no-reset': true});
  beforeEach(async () => await loadWebView(specialCaps, driver));

  // iOS8 currently does not disable the phishing warning for foo:bar@ type
  // addresses, even when running the sim manually
  // TODO: find another way to trigger the phishing warning that IS disabled
  // by the pref on iOS8
  it('should not display a phishing warning with safariIgnoreFraudWarning @skip-chrome @skip-ios8', async () => {
    let titleToBecomeRight = new ChaiAsserter(async (driver) =>
      (await driver.title()).should.contain("I am another page title"));

    await driver.get(env.PHISHING_END_POINT + 'guinea-pig2.html');
    await driver.waitFor(titleToBecomeRight, 10000, 500);
  });
});

// skipped on real devices, see https://github.com/appium/appium/issues/5166
describe('performance logs @skip-real-device', async () => {
  let specialCaps = Object.assign({}, desired);
  specialCaps.loggingPrefs = {performance: 'ALL'};

  const driver = await setup(this, specialCaps, {'no-reset': true});
  beforeEach(async () => await loadWebView(specialCaps, driver));

  it('should fetch performance logs', async () => {
    (await driver.logTypes()).should.include('performance');
    (await driver.log('performance')).should.not.be.empty;
  });
});
