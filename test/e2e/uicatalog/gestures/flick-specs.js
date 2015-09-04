import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';

let SLOW_DOWN_MS = 1000;

// TODO: from the skip flick does not work in any supported ios,
//       (the element flick actually work, just speedFlick is broken)
//       maybe try it on real devices
describe('uicatalog - gestures - flick @skip-ios8 @skip-ios7 @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

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
