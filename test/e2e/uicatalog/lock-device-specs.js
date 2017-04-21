import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - lock device', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  let allowance = 10;
  it(`should lock the device for 4 seconds (+/- ${allowance} secs)`, async () => {
    let before = new Date().getTime() / 1000;
    await driver.lock(4);
    let now = (new Date().getTime() / 1000);
    (now - before).should.be.above(4);
    (now - before).should.be.below(4 + allowance + 1);
  });
  it(`should default to 0 lock the device for +/- ${allowance} secs`, async () => {
    let before = new Date().getTime() / 1000;
    await driver.lock(0);
    let now = (new Date().getTime() / 1000);
    (now - before).should.be.above(0);
    (now - before).should.be.below(allowance + 1);
  });
});
