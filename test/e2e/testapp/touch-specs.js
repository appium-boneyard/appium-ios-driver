import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import { okIfAlert } from '../helpers/recipes';

//let okIfAlert = require('../../../helpers/alert').okIfAlert,

describe('testapp - touch actions', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  async function goToMap () {
    let map;
    try {
      map = await driver.findElement('xpath', '//UIAMapView');
    } catch (ign) {}
    if (!map) {
      let buttons = await driver.findElements('class name', 'UIAButton');
      let gestures = [{action: 'tap', options: {element: buttons[5].ELEMENT}}];
      await driver.performTouch(gestures);
      await B.delay(500);
      await okIfAlert(driver);
      await B.delay(500);
    }
  }

  describe('tap', function () {
    it('should tap on a specified element', async () => {
      let buttons = await driver.findElements('class name', 'UIAButton');
      let gestures = [{action: 'tap', options: { element: buttons[1].ELEMENT}}];
      await driver.performTouch(gestures);
      await B.delay(1000);
      await okIfAlert(driver);
    });
  });

  describe('wait', function () {
    it('should move the page and wait a bit', async () => {
      await goToMap();
      let map = await driver.findElement('xpath', '//UIAMapView');
      let gestures = [
        {action: 'press', options: {element: map.ELEMENT}},
        {action: 'moveTo', options: {element: map.ELEMENT, x: 0, y:100}},
        {action: 'wait', options: {ms: 5000}},
        {action: 'moveTo', options: {element: map.ELEMENT, x: 0, y:0}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
    });
  });

  describe('pinch', function () {
    it('should do some pinching', async () => {
      await goToMap();
      let map = await driver.findElement('xpath', '//UIAMapView');
      let actions = [
        [{action: 'press', options: {element: map.ELEMENT}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 0, y: 0}},
         {action: 'release'}],
        [{action: 'press', options: {element: map.ELEMENT}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 100, y: 100}},
         {action: 'release'}],
      ];
      await driver.performMultiAction(actions);
      await B.delay(1000);
    });

    it('should do more involved pinching in and out', async () => {
      await goToMap();
      let map = await driver.findElement('xpath', '//UIAMapView');
      let actions = [
        [{action: 'press', options: {element: map.ELEMENT}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 25, y: 25}},
         {action: 'wait', options: {ms: 3000}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 100, y: 100}},
         {action: 'release'}],
        [{action: 'press', options: {element: map.ELEMENT}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 100, y: 0}},
         {action: 'wait', options: {ms: 3000}},
         {action: 'moveTo', options: {element: map.ELEMENT, x: 0, y: 0}},
         {action: 'release'}],
      ];
      await driver.performMultiAction(actions);
      await B.delay(1000);
    });
  });
});

describe('testapp - swipe actions', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  describe('swipe', function () {
    let slider, target, loc;
    let leftPos = { x: 0, y: 0 },
        rightPos = { x: 0, y: 0 },
        centerPos = { x: 0, y: 0 };

    let getNumericValue = function (pctVal) {
      pctVal = pctVal.replace("%", "");
      pctVal = parseInt(pctVal, 10);
      return pctVal;
    };

    let testSliderValueNot0or100 = function (value) {
      value = getNumericValue(value);
      // should be ~50
      value.should.be.above(15);
      value.should.be.below(85);
    };

    let getSliderValue = async function () {
      return await driver.getAttribute('value', slider);
    };

    before(async () => {
      slider = await driver.findElement('class name', "UIASlider");
      loc = await driver.getLocation(slider);
      let size = await driver.getSize(slider);
      leftPos.x = loc.x - 5;
      centerPos.x = loc.x + (size.width * 0.5);
      rightPos.x = loc.x + size.width + 5;
      leftPos.y = rightPos.y = centerPos.y = loc.y + (size.height * 0.5);
      target = await driver.findElement('accessibility id', "Access'ibility");
      testSliderValueNot0or100(await getSliderValue());
    });

    // TODO: For some reason it does not swipe to 100% in ci env, investigate
    it('should work with: press {element}, moveTo {destEl} @skip-ci', async () => {
      let origValue = await getSliderValue();
      let gestures = [
        {action: 'press', options: {element: slider.ELEMENT}},
        {action: 'wait', options: {ms: 500}},
        {action: 'moveTo', options: {element: target.ELEMENT}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
      (await getSliderValue()).should.not.equal(origValue);
      await B.delay(1000);
      // TODO: in ios84 the destEl is in a weird place, so we don't test value
      //(await getSliderValue()).should.equal("100%")
    });

    it('should work with: press {element, x, y}, moveTo {element, x, y}', async () => {
      let gestures = [
        {action: 'press', options: {element: slider.ELEMENT, x: 0.8665, y: 0.5}},
        {action: 'wait', options: {ms: 500}},
        {action: 'moveTo', options: {element: slider.ELEMENT, x: 0.5, y: 0.5}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
      testSliderValueNot0or100(await getSliderValue());
      await B.delay(1000);
    });

    it('should work with: press {x, y}, moveTo {x, y}', async () => {
      let gestures = [
        {action: 'press', options: {x: centerPos.x, y: centerPos.y}},
        {action: 'wait', options: {ms: 500}},
        {action: 'moveTo', options: {x: leftPos.x - centerPos.x, y: leftPos.y - centerPos.y}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
      (await getSliderValue()).should.equal("0%");
    });

    it('should work with: {element, x, y}, moveTo {destEl, x, y} @skip-ci', async () => {
      let gestures = [
        {action: 'press', options: {element: slider.ELEMENT, x: 0, y: 0.5}},
        {action: 'wait', options: {ms: 500}},
        {action: 'moveTo', options: {element: target.ELEMENT, x: 50, y: 0.5}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
      testSliderValueNot0or100(await getSliderValue());
    });

    // TODO: Crashes in ci env, investigate
    // TODO: For some reason it does not swipe to 100% in ci env, investigate
    it("should work with press {x, y}, moveTo {destEl} @skip-ci", async () => {
      let origValue = await getSliderValue();
      let gestures = [
        {action: 'press', options: {x: centerPos.x, y: centerPos.y}},
        {action: 'wait', options: {ms: 500}},
        {action: 'moveTo', options: {element: target.ELEMENT}},
        {action: 'release'}
      ];
      await driver.performTouch(gestures);
      (await getSliderValue()).should.not.equal(origValue);
      // TODO: weird element position in iOS 8.4 so not checking exact value.
      //.then(getSliderValue).should.become("100%")
    });
  });
});
