import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - move @skip-ios6', function () {

  describe('moveTo and click', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    it('should be able to click on arbitrary x-y elements', async () => {
      let axIdExt = env.IOS8 || env.IOS9 ? "" : ", AAPLButtonViewController";
      let el1 = await driver.findElement('accessibility id', `Buttons${axIdExt}`);
      await driver.moveTo(el1, 10, 10);
      await driver.clickCurrent();
      let el2 = await driver.findElement('xpath', "//UIAElement['SYSTEM (CONTACT ADD)']");
      el2.should.exist;
    });
  });
});
