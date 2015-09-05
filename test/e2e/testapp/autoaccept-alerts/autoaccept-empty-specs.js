import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';

describe('testapp - autoAcceptAlerts default', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('does not auto-accept alerts', async () => {
    let el = await driver.findElement('accessibility id', 'show alert');
    await driver.click(el);
    await B.delay(2000);
    (await driver.getAlertText()).should.exist;
  });
});
