import setup from "../../setup-base";
import desired from '../desired';
import { filterVisibleUiaSelector } from '../../helpers/recipes';

describe('testapp - basics - calc app 1', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  let values = null;
  let byUIA = '-ios uiautomation';

  let clearFields = async function () {
    values = [];
    let els = await driver.findElements('class name', 'UIATextField');
    for (let el of els) {
      await driver.clear(el);
    }
    let button = await driver.findElement('class name', 'UIAButton');
    await driver.click(button);
  };

  let populate = async function (type) {
    values = [];
    let els = await driver.findElements(byUIA, filterVisibleUiaSelector('.textFields();'));
    for (let el of els) {
      let val = Math.round(Math.random() * 10);
      values.push(val);
      if (type === "elem") {
        await driver.setValue(val, el);
      } else if (type === "elem-setvalue") {
        await driver.setValueImmediate(val, el);
      } else if (type === "driver") {
        await driver.click(el);
        await driver.keys(val);
      }
    }
  };

  let computeAndCheck = async function () {
    let button = await driver.findElement('class name', 'UIAButton');
    await driver.click(button);
    let el = await driver.findElement('class name', 'UIAStaticText');
    let result = parseInt(await driver.getText(el), 10);
    result.should.equal(values[0] + values[1]);
  };

  beforeEach(async () => {
    await clearFields();
  });

  it('should fill two fields with numbers', async () => {
    await populate("elem");
    await computeAndCheck();
  });

  // using sendKeysToActiveElement
  it('should fill two fields with numbers - sendKeys', async () => {
    await populate("driver");
    await computeAndCheck();
  });

  it('should fill two fields with numbers - setValue', async () => {
    await populate("elem-setvalue");
    await computeAndCheck();
  });

  it('should confirm that button is displayed', async () => {
    let el = await driver.findElement('class name', 'UIATextField');
    (await driver.elementDisplayed(el)).should.be.ok;
  });

  it('should confirm that the disabled button is disabled', async () => {
    let el = await driver.findElement('accessibility id', 'DisabledButton');
    (await driver.elementEnabled(el)).should.not.be.ok;
  });

  it('should confirm that the compute sum button is enabled', async () => {
    let el = await driver.findElement('accessibility id', 'ComputeSumButton');
    (await driver.elementEnabled(el)).should.be.ok;
  });

  it('should interact with alert', async () => {
    let button = (await driver.findElements('class name', 'UIAButton'))[1];
    await driver.click(button);
    await driver.postAcceptAlert();
    await driver.click(button);
    let text = await driver.getAlertText();
    text.should.include("Cool title");
    text.should.include("this alert is so cool.");
    await driver.postDismissAlert();
  });

  it('should find alert like other elements', async () => {
    try {
      let button = (await driver.findElements('class name', 'UIAButton'))[1];
      await driver.click(button);
      let alert = await driver.findElement('class name', 'UIAAlert');
      let els = await driver.findElementsFromElement('class name', 'UIAStaticText', alert);
      let texts = [];
      for (let el of els) {
        texts.push(await driver.getText(el));
      }
      texts.should.include('Cool title');
      texts.should.include('this alert is so cool.');
    } finally {
      await driver.postDismissAlert();
    }
  });

  it('should get tag names of elements', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    (await driver.getName(el)).should.equal("UIAButton");
    el = await driver.findElement('class name', 'UIAStaticText');
    (await driver.getName(el)).should.equal('UIAStaticText');
  });

  it('should be able to get text of a button', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    (await driver.getText(el)).should.equal("Compute Sum");
  });

});
