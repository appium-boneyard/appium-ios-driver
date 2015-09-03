import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - background app @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it("should background the app for 4 of seconds (+/- 6 secs)", async () => {
    let before = new Date().getTime() / 1000;
    await driver.background(8);
    let timeDifference = ((new Date().getTime() / 1000) - before);
    timeDifference.should.be.above(8);
    timeDifference.should.be.below(15);
  });
});
