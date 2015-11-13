import desired from './desired';
import setup from '../setup-base';
import { loadWebView } from '../helpers/webview';

describe('safari - webview - executeAsync @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should bubble up javascript errors', async () => {
    (await driver.executeAsync(`'nan'--`)).should.be.rejectedWith(/status: (13|17)/);
  });

  it('should execute async javascript', async () => {
    await driver.setAsyncScriptTimeout(10000);
    (await driver.executeAsync(`arguments[arguments.length - 1](123);`)).should.become(123);
  });

  it(`should timeout when callback isn't invoked`, async () => {
    await driver.setAsyncScriptTimeout(2000);
    (await driver.executeAsync(`return 1 + 2`)).should.be.rejectedWith(/status: 28/);
  });
});
