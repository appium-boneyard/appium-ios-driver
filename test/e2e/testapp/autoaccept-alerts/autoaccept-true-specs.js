import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import _ from 'lodash';
import { throwMatchableError } from '../../helpers/recipes';

describe('testapp - autoAcceptAlerts cap = true', function () {
  let session = setup(this, _.defaults({
    autoAcceptAlerts: true}, desired));
  let driver = session.driver;

  it('auto-accepts alerts', async () => {
    let el = await driver.findElement('accessibility id', 'show alert');
    await driver.click(el);
    await B.delay(2000);
    await B.resolve(driver.getAlertText())
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 27/);
  });
});
