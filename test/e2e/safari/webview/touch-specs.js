import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../helpers/webview';
import { TouchAction, MultiAction } from 'wd';

describe("safari - webview - touch actions @skip-ios6", function () {

module.exports = function (desired) {
  const driver = await setup(this, _.defaults({ 'noReset': true }, desired));
  beforeEach((done) => loadWebView(desired, driver).nodeify(done););

  it('should not be able to do native touch actions', (done) => {
    let el = await driver.elementById('comments');
    let action = new TouchAction(driver);
    action.tap({
      el: el,
      count: 10
    });
    (await action.perform()).should.be.rejectedWith("status: 13");
  });

  it('should not be able to do native multi touch actions', (done) => {
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
