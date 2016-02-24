import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import _ from 'lodash';

describe('testapp - autoDismissAlerts cap = false', function () {
  let session = setup(this, _.defaults({
    autoDismissAlerts: false}, desired));
  let driver = session.driver;

  it('does not auto-dismiss alerts', async () => {
    let el = await driver.findElement('accessibility id', 'show alert');
    await driver.click(el);
    await B.delay(2000);
    (await driver.getAlertText()).should.exist;
  });
});
