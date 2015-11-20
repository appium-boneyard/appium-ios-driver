/* globals expect */
import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../../helpers/webview';

describe('safari - webview - executeAsync @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should bubble up javascript errors', async () => {
    expect(async () => await driver.executeAsync(`'nan'--`)).to.throw;
  });

  it('should execute async javascript', async () => {
    await driver.asyncScriptTimeout(10000);
    (await driver.executeAsync(`arguments[arguments.length - 1](123);`)).should.be.equal(123);
  });

  it(`should timeout when callback isn't invoked`, async () => {
    await driver.asyncScriptTimeout(2000);
    expect(async () => await driver.executeAsync(`return 1 + 2`)).to.throw;
  });
});
