import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import _ from 'lodash';

describe('testapp - autoAcceptAlerts cap = false', function () {
  let session = setup(this, _.defaults({
    autoAcceptAlerts: false}, desired));
  let driver = session.driver;

  it('does not auto-accept alerts', async () => {
    let el = await driver.findElement('accessibility id', 'show alert');
    await driver.click(el);
    await B.delay(2000);
    (await driver.getAlertText()).should.exist;
  });
});
