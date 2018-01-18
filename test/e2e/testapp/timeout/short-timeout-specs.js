import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import { throwMatchableError } from '../../helpers/recipes';
import env from '../../helpers/env';
import {BaseDriver} from "appium-base-driver";

describe('testapp - timeout', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  afterEach(async function () { await B.delay(3000); });

  describe('short timeout', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    it('should die with short command timeout', async function () {
      await driver.timeouts({protocol: BaseDriver.DRIVER_PROTOCOL.MJSONWP, type: 'command', ms: 3000}, "1dcfe021-8fc8-49bd-8dac-e986d3091b97");
      await B.delay(5500);
      await B.resolve(driver.findElement('accessibility id', 'dont exist dogg'))
        .catch(throwMatchableError)
        .should.be.rejectedWith(/jsonwpCode: (13|6)/);
    });
  });
});
