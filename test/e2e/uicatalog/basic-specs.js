import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import _ from 'lodash';


describe('uicatalog - basic', () => {
  let textTag = env.IOS7 ? '@label' : '@value';

  describe('api', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    describe('getStrings', () => {
      it('should return default strings', async () => {
        let strings = await driver.getStrings();
        _.keys(strings).length.should.be.above(10);
      });
      it('should return English strings', async () => {
        let strings = await driver.getStrings('en');
        _.keys(strings).length.should.be.above(10);
      });
      it('should return English strings with string file', async () => {
        let strings = await driver.getStrings('en', 'Localizable.strings');
        _.keys(strings).length.should.be.above(10);
      });
    });

    describe('elements', () => {
      beforeEach(async () => {
        try { await driver.back(); } catch (ign) {}
      });

      it('should confirm element is not visible', async () => {
        let el1 = await driver.findElement('xpath', `//UIAStaticText[contains(${textTag}, 'Buttons')]`);
        await driver.click(el1);
        let el2 = await driver.findElement('xpath', "//UIANavigationBar/UIAImage");
        (await driver.elementDisplayed(el2)).should.not.be.ok;
      });

      it('should confirm element is visible', async () => {
        let el1 = await driver.findElement('xpath', `//UIAStaticText[contains(${textTag}, 'Buttons')]`);
        await driver.click(el1);
        let el2 = await driver.findElement('xpath', "//UIATableGroup[@name = 'SYSTEM (CONTACT ADD)']");
        (await driver.elementDisplayed(el2)).should.be.ok;
      });

      it('should confirm element is selected', async () => {
        await driver.execute("mobile: scroll", {direction: 'down'});
        let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@label, 'Switches')]");
        await driver.click(el1);
        let el2 = await driver.findElement('class name', 'UIASwitch');
        (await driver.elementSelected(el2)).should.be.ok;
      });

      it('should confirm element is not selected returns false', async () => {
        try {
          await driver.execute("mobile: scroll", {direction: 'down'});
        } catch (ign)  {
          // Instruments is broken in 8.1, 8.2, 8.3
          // can't scroll if already scrolled all the way down
        }
        let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@label, 'Switches')]");
        await driver.click(el1);
        let el2 = await driver.findElement('class name', 'UIASwitch');
        await driver.click(el2);
        (await driver.elementSelected(el2)).should.not.be.ok;
      });
    });
  });

  describe('appium ios @skip-ci', function () {
    // TODO: check this test, it does not do what it says
    let session = setup(this, desired);
    let driver = session.driver;

    it('should go back to using app from before', async () => {
      let els = await driver.findElements('class name', 'UIATableView');
      els.should.have.length.above(0);
    });
  });

});
