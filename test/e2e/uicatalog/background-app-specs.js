import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - background app', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it("should background the app for 2 of seconds (+/- 10 secs)", async () => {
    let before = new Date().getTime() / 1000;
    await driver.background(2);
    let timeDifference = ((new Date().getTime() / 1000) - before);
    timeDifference.should.be.above(2);
    timeDifference.should.be.below(15);

    (await driver.getPageSource()).should.include('UICatalog');
  });
});
