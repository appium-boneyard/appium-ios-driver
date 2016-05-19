import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import _ from 'lodash';


describe('uicatalog - touch', function () {
  let session = setup(this, _.defaults({
    fullReset: true,
    noReset: false
  }, desired));
  let driver = session.driver;

  describe('tap', function () {
    before(async () => {
      // make sure we are in the right place
      try {
        await driver.back();
      } catch (ign) {}

      await driver.execute("mobile: scroll", {direction: 'down'});
    });

    afterEach(async () => {
      try {
        await driver.back();
      } catch (ign) {}
    });

    it('should tap element with count', async () => {
      let el1 = await driver.findElement('xpath', '//UIAStaticText[contains(@label, \'Steppers\')]');
      await driver.click(el1);
      let el2 = await driver.findElement('accessibility id', 'Increment');
      let gestures = [{action: 'tap', options: {count: 10, element: el2.ELEMENT}}];
      await driver.performTouch(gestures);
      let els = await driver.findElements('accessibility id', '10');
      els.should.have.length(2);
    });

    it('should tap element with offset and count', async () => {
      let el1 = await driver.findElement('xpath', '//UIAStaticText[contains(@label, \'Steppers\')]');
      await driver.click(el1);
      let el2 = await driver.findElement('accessibility id', 'Increment');
      let gestures = [{action: 'tap', options: {x:10, y:10, count: 7, element: el2.ELEMENT}}];
      await driver.performTouch(gestures);
      let els = await driver.findElements('accessibility id', '7');
      els.should.have.length(2);
    });

    it('should tap offset with count', async () => {
      let el1 = await driver.findElement('xpath', '//UIAStaticText[contains(@label, \'Steppers\')]');
      await driver.click(el1);
      let el2 = await driver.findElement('accessibility id', 'Increment');
      let loc = await driver.getLocation(el2);
      let gestures = [{action: 'tap', options: {x:loc.x, y:loc.y, count: 3}}];
      await driver.performTouch(gestures);
      let els = await driver.findElements('accessibility id', '3');
      els.should.have.length(2);
    });
  });

  describe('flick @skip-ios8 @skip-ios7', function () {
    const SLOW_DOWN_MS = 1000;

    afterEach(async () => {
      await driver.flick(undefined, 0, 100);
      await driver.flick(undefined, 0, 100);
      await B.delay(SLOW_DOWN_MS);
    });

    describe('with element', function () {
      it("slider value should change", async () => {
        let els = await driver.findElements('class name', 'UIATableCell');
        await driver.click(els[10]);
        let slider = await driver.findElement('class name', "UIASlider");
        let valueBefore = await driver.getAttribute("value", slider);
        await driver.flick(slider, undefined, undefined, -0.5, 0, 1);
        let valueAfter = await driver.getAttribute("value", slider);
        valueBefore.should.not.equal("0%");
        valueAfter.should.equal("0%");
      });
    });
  });

  describe('mobile scroll', function () {
    before(async () => {
      try {
        await driver.back();
      } catch (ign) {}

      // we want to begin at the top, so try to scroll up there
      await driver.execute("mobile: scroll", {direction: 'up'});
    });

    it('should scroll down and up', async () => {
      let el = await driver.findElement('class name', 'UIATableCell');
      let loc1 = await driver.getLocationInView(el);

      await driver.execute("mobile: scroll", {direction: 'down'});
      let loc2 = await driver.getLocationInView(el);
      loc2.x.should.equal(loc1.x);
      loc2.y.should.not.equal(loc1.y);

      await driver.execute("mobile: scroll", {direction: 'up'});
      let loc3 = await driver.getLocationInView(el);
      loc3.x.should.equal(loc2.x);
      loc3.y.should.not.equal(loc2.y);
    });

    it('should scroll down and up using element', async () => {
      let tableView = await driver.findElement('class name', 'UIATableView');
      let el = await driver.findElement('class name', 'UIATableCell');
      let loc1 = await driver.getLocationInView(el);

      await driver.execute("mobile: scroll", {element: tableView, direction: 'down'});
      let loc2 = await driver.getLocationInView(el);
      loc2.x.should.equal(loc1.x);
      loc2.y.should.not.equal(loc1.y);

      await driver.execute("mobile: scroll", {element: tableView, direction: 'up'});
      let loc3 = await driver.getLocationInView(el);
      loc3.x.should.equal(loc2.x);
      loc3.y.should.not.equal(loc2.y);
    });

    it('should be able to be called multiple times', async () => {
      await driver.execute("mobile: scroll", {direction: 'down'});
      await driver.execute("mobile: scroll", {direction: 'down'});
      await driver.execute("mobile: scroll", {direction: 'down'});
      await driver.execute("mobile: scroll", {direction: 'down'});
      await driver.execute("mobile: scroll", {direction: 'down'});
    });
  });

  describe('mobile shake', function () {
    it('should not error', async () => {
      await driver.mobileShake();
    });
  });

  describe('moveTo and click', function () {
    before(async () => {
      try {
        await driver.back();
      } catch (ign) {}
      try {
        // we want to begin at the top, so try to scroll up there
        await driver.execute("mobile: scroll", {direction: 'up'});
      } catch (ign) {}
    });
    
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
