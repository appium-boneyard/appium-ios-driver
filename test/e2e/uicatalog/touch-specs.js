import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - touch @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

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
