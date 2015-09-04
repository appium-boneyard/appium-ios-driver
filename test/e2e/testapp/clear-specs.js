import setup from "../setup-base";
import desired from './desired';

describe('testapp - clear', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should clear the text field', async () => {
    let el = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("some-value", el);
    (await driver.getText(el)).should.equal("some-value");
    await driver.clear(el);
    (await driver.getText(el)).should.equal("");
  });

  // Tap outside hide keyboard strategy can only be tested in UICatalog

  // these tests need to be moved out of "clear-specs", and consolidated with the
  // UICatalog ones

  it('should hide keyboard using "Done" key', async () => {
    let el1 = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("1", el1);
    let el2 = await driver.findElement('class name', 'UIASwitch');
    (await driver.elementDisplayed(el2)).should.not.be.ok;
    await driver.hideKeyboard(undefined, "Done", driver.sessionId);
    (await driver.elementDisplayed(el2)).should.be.ok;
  });

  it('should hide keyboard using "pressKey" strategy with "Done" key', async () => {
    let el1 = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("1", el1);
    let el2 = await driver.findElement('class name', 'UIASwitch');
    (await driver.elementDisplayed(el2)).should.not.be.ok;
    await driver.hideKeyboard('pressKey', "Done", driver.sessionId);
    (await driver.elementDisplayed(el2)).should.be.ok;
  });

  it('should hide keyboard using "pressKey" strategy with "Done" keyName', async () => {
    let el1 = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("1", el1);
    let el2 = await driver.findElement('class name', 'UIASwitch');
    (await driver.elementDisplayed(el2)).should.not.be.ok;
    await driver.hideKeyboard('pressKey', undefined, undefined, "Done", driver.sessionId);
    (await driver.elementDisplayed(el2)).should.be.ok;
  });

  it('should hide keyboard using "press" strategy with "Done" key', async () => {
    let el1 = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("1", el1);
    let el2 = await driver.findElement('class name', 'UIASwitch');
    (await driver.elementDisplayed(el2)).should.not.be.ok;
    await driver.hideKeyboard('press', "Done", driver.sessionId);
    (await driver.elementDisplayed(el2)).should.be.ok;
  });

  // swipedown just doesn't work with testapp
  it.skip('should hide keyboard using "swipeDown" strategy', async () => {
    let el1 = await driver.findElement('class name', 'UIATextField');
    await driver.setValue("1", el1);
    let el2 = await driver.findElement('class name', 'UIASwitch');
    (await driver.elementDisplayed(el2)).should.not.be.ok;
    await driver.hideKeyboard('swipeDown', driver.sessionId);
    (await driver.elementDisplayed(el2)).should.be.ok;
  });

});
