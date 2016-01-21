/* globals expect */
import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../../helpers/webview';

describe("safari - webview - window title", function () {
  const driver = setup(this, desired, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should return a valid title on web view', async () => {
    (await driver.title()).should.include("I am a page title");

    await driver.setContext('NATIVE_APP');
    expect(async () => await driver.title()).to.throw;
  });
});
