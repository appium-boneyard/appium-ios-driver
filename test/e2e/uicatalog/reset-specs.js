import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';

describe('uicatalog - reset', function () {

  describe('app reset', function () {
    let session = setup(this, desired);
    let driver = session.driver;
    let rawDriver = session.rawDriver;

    it("should be able to find elements after a soft reset", async () => {
      rawDriver.ready.should.be.ok;
      let els = await driver.findElements('class name', 'UIATableView');
      els.should.have.length(1);
      await driver.reset();
      rawDriver.ready.should.be.ok;
      await B.delay(1000);
      els = await driver.findElements('class name', 'UIATableView');
      els.should.have.length(1);
    });

    it('should successfully close an app', async () => {
      rawDriver.ready.should.be.ok;
      await driver.closeApp();
      rawDriver.ready.should.not.be.ok;
      await driver.launchApp();
      rawDriver.ready.should.be.ok;
      let els = await driver.findElements('class name', 'UIATableView');
      els.should.have.length(1);
    });
  });
});
