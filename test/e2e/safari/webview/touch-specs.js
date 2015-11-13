import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../../helpers/webview';
import { TouchAction, MultiAction } from 'wd';

describe("safari - webview - touch actions @skip-ios6", function () {
  const driver = setup(this, Object.assign({ 'noReset': true }, desired)).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should not be able to do native touch actions', async () => {
    let el = await driver.findElement('id', 'comments');
    let gestures = [
      {action: 'press', options: {element: el}},
      {action: 'release'}
    ];
    expect(async () => await driver.performTouch(gestures)).to.throw;
  });
});
