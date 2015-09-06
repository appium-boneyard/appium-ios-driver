import setup from "../../setup-base";
import desired from '../desired';
import env from '../../helpers/env';
import B from 'bluebird';
import { throwMatchableError } from '../../helpers/recipes';

describe('testapp - timeout', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  afterEach(async () => { await B.delay(3000); });

  describe('implicit wait', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    let impWaitCheck = async function (strat, sel, impWaitMs) {
      let beforeMs = new Date().getTime();
      let missingEls = await driver.findElements(strat, sel);
      let afterMs = new Date().getTime();
      (afterMs - beforeMs).should.be.below(impWaitMs + 2000);
      (afterMs - beforeMs).should.be.above(impWaitMs);
      missingEls.should.have.length(0);
    };

    let impWaitCheckSingle = async function (strat, sel, impWaitMs) {
      let beforeMs = new Date().getTime();
      await B.resolve(driver.findElement(strat, sel))
        .catch(throwMatchableError)
        .should.be.rejectedWith(/jsonwpCode: 7/);
      let afterMs = new Date().getTime();
      (afterMs - beforeMs).should.be.below(impWaitMs + 2000);
      (afterMs - beforeMs).should.be.above(impWaitMs);
    };

    it('should set the implicit wait for finding elements', async () => {
      await driver.implicitWait(4000);
      await impWaitCheck('class name', 'UIANotGonnaBeHere', 4000);
      await impWaitCheck('accessibility id', 'FoShoIAintHere', 4000);
      await impWaitCheckSingle('accessibility id', 'FoShoIAintHere', 4000);
    });

    it('should work with small command timeout', async () => {
      await driver.timeouts('command', 5000);
      await driver.implicitWait(10000);
      await impWaitCheck('class name', 'UIANotGonnaBeHere', 10000);
    });

    it('should work even with a reset in the middle', async () => {
      await driver.timeouts('command', 60000);
      await driver.implicitWait(4000);
      await impWaitCheck('class name', 'UIANotGonnaBeHere', 4000);
      await driver.reset();
      await B.delay(3000); // cooldown
      await impWaitCheck('class name', 'UIANotGonnaBeHere', 4000);
    });

  });
});
