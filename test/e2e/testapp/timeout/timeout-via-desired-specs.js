import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import { throwMatchableError } from '../../helpers/recipes';
import env from '../../helpers/env';
import _ from 'lodash';

describe('testapp - timeout', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  afterEach(async function () { await B.delay(3000); });

  describe('via desired caps', function () {
    let session = setup(this, _.defaults({newCommandTimeout: 3}, desired));
    let driver = session.driver;

    it('should die with short command timeout', async function () {
      await B.delay(5500);
      await B.resolve(driver.findElement('accessibility id', 'dont exist dogg'))
        .catch(throwMatchableError)
        .should.be.rejectedWith(/jsonwpCode: (13|6)/);
    });
  });
});
