import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../helpers/webview';
import { TouchAction, MultiAction } from 'wd';

describe("safari - webview - touch actions @skip-ios6", function () {
  const driver = setup(this, Object.assign({ 'noReset': true }, desired));
  beforeEach(async () => await loadWebView(desired, driver));

  it('should not be able to do native touch actions', async () => {
    let el = await driver.elementById('comments');
    let action = new TouchAction(driver);
    action.tap({
      el: el,
      count: 10
    });
    (await action.perform()).should.be.rejectedWith("status: 13");
  });

  it('should not be able to do native multi touch actions', async () => {
    let el = await driver.elementById('comments');
    let action = new TouchAction(driver);
    action.tap({
      el: el,
      count: 10
    });
    let ma = new MultiAction(driver);
    ma.add(action, action);
    (await ma.perform()).should.be.rejectedWith("status: 13");
  });
});
