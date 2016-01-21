import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';

describe('uicatalog - clear', function () {

  describe('hide keyboard', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    beforeEach(async () => {
      try {
        await driver.execute("mobile: scroll", {direction: 'down'});
      } catch (ign) {}
    });
    afterEach(async () => {
      try {
        await driver.back();
      } catch (ign) {}
    });

    it('should be able to hide keyboard with the default strategy', async () => {
      let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@name, 'Web View')]");
      await driver.click(el1);
      await driver.findElement('xpath', '//UIANavigationBar[@name="Web View"]');
      let el2 = await driver.findElement('xpath', "//UIATextField");
      await driver.click(el2);
      await driver.findElement('accessibility id', 'Go');
      await driver.hideKeyboard();
      await B.delay(1000);
      (await driver.findElements('accessibility id', 'Go')).should.have.length(0);
    });

    it('should be able to hide keyboard with the tapOutside strategy', async () => {
      let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@name, 'Web View')]");
      await driver.click(el1);
      await driver.findElement('xpath', '//UIANavigationBar[@name="Web View"]');
      let el2 = await driver.findElement('xpath', "//UIATextField");
      await driver.click(el2);
      await driver.findElements('accessibility id', 'Go');
      await driver.hideKeyboard('tapOutside');
      await B.delay(1000);
      (await driver.findElements('accessibility id', 'Go')).should.have.length(0);
    });

    it('should be able to hide keyboard with the tapOut strategy', async () => {
      let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@name, 'Web View')]");
      await driver.click(el1);
      await driver.findElement('xpath', '//UIANavigationBar[@name="Web View"]');
      let el2 = await driver.findElement('xpath', "//UIATextField");
      await driver.click(el2);
      await driver.findElements('accessibility id', 'Go');
      await driver.hideKeyboard('tapOut');
      await B.delay(1000);
      (await driver.findElements('accessibility id', 'Go')).should.have.length(0);
    });
  });
});
