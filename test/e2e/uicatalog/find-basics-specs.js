import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import { clickButton, throwMatchableError } from '../helpers/recipes';

describe('uicatalog - find - basics', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should find a single element by id', async () => {
    let el = await driver.findElement('id', 'Date Picker');
    el.should.exist;
  });

  it('should find a single element by id wrapped in array for multi', async () => {
    let els = await driver.findElements('id', 'Back');
    els.should.have.length(1);
  });

  it('should find a single element using elementByAccessibilityId', async () => {
    let axId = (env.IOS8 || env.IOS9) ? 'AAPLImageViewController' :
                                        'Image View, AAPLImageViewController';
    let el = await driver.findElement('accessibility id', axId);
    el.should.exist;
  });

  it('should find an element within descendants', async () => {
    let el1 = await driver.findElement('xpath', "//UIATableCell[contains(@name, 'Buttons')]");
    el1.should.exist;
    let el2 = await driver.findElementFromElement('class name', 'UIAStaticText', el1);
    (await driver.getAttribute('name', el2)).should.contain("Buttons");
  });

  it('should not find an element not within itself', async () => {
    let el1 = await driver.findElement('xpath', "//UIATableCell[contains(@name, 'Buttons')]");
    el1.should.exist;
    await B.resolve(driver.findElementFromElement('class name', 'UIANavigationBar', el1))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 7/);
  });

  it('should find some elements within itself', async () => {
    let elLength = (env.IOS8 || env.IOS9) ? 2 : 1;
    let el1 = await driver.findElement('xpath', "//UIATableCell[contains(@name, 'Buttons')]");
    el1.should.exist;
    let els = await driver.findElementsFromElement('class name', 'UIAStaticText', el1);
    els.should.have.length(elLength);
  });

  it('should not find elements not within itself', async () => {
    let el1 = await driver.findElement('xpath', "//UIATableCell[contains(@name, 'Buttons')]");
    el1.should.exist;
    let els = await driver.findElementsFromElement('class name', 'UIANavigationBar', el1);
    els.should.have.length(0);
  });

  describe('no mix up', () => {
    after(async() => {
      if (!env.IOS81 && !env.IOS82 && !env.IOS83 && !env.IOS84 && !env.IOS9) {
        await clickButton(driver, 'UICatalog');
      }
    });

    it('should not allow found elements to be mixed up', async () => {
      let el1 = await driver.findElement('class name', 'UIATableCell');
      let el1Name = await driver.getAttribute('name', el1);
      await driver.click(el1);
      await B.delay(1000);

      let el2 = await driver.findElement('class name', 'UIATableCell');
      let el2Name = await driver.getAttribute('name', el2);
      el1.ELEMENT.should.not.equal(el2.ELEMENT);
      el1Name.should.not.equal(el2Name);

      // el1 is gone, so it doesn't have a name anymore
      (await driver.getAttribute('name', el1)).should.equal("");
    });
  });

  it('should return all image elements with internally generated ids', async () => {
    let els = await driver.findElements('class name', 'UIAImage');
    els.length.should.be.above(0);
    for (let el of els) {
      el.should.exist;
    }
  });

  describe('findElementsByClassName textfield case', () => {
    after(async () => {
      if (!env.IOS81 && !env.IOS82 && !env.IOS83 && !env.IOS84 && !env.IOS9) {
        await clickButton(driver, 'UICatalog');
      }
    });
    let axIdExt = (env.IOS8 || env.IOS9) ? '' : ', AAPLActionSheetViewController';
    it('should find only one textfield', async () => {
      let el1 = await driver.findElement('accessibility id', `Action Sheets${axIdExt}`);
      await driver.click(el1);
      let el2 = await driver.findElement('accessibility id', 'Okay / Cancel');
      let els = await driver.findElementsFromElement('class name', 'UIAStaticText', el2);
      els.should.have.length(1);
    });
  });

  describe('findElement(s) containing accessibility id', () => {
    afterEach(async () => {
      await clickButton(driver, 'UICatalog');
      await B.delay(1000);
    });

    let axIdExt = (env.IOS8 || env.IOS9) ? '' : ', AAPLActionSheetViewController';
    it('should find one element', async () => {
      let el1 = await driver.findElement('accessibility id', `Action Sheets${axIdExt}`);
      await driver.click(el1);
      let el2 = await driver.findElement('accessibility id', 'Okay / Cancel');
      (await driver.getAttribute('name', el2)).should.equal('Okay / Cancel');
    });

    it('should find several elements', async () => {
      let el1 = await driver.findElement('accessibility id', `Action Sheets${axIdExt}`);
      await driver.click(el1);
      let el2 = await driver.findElements('accessibility id', 'Okay / Cancel');
      el2.should.have.length(2);
    });
  });

  describe('duplicate text field', () => {
    beforeEach(async () => {
      try {
        await driver.execute("mobile: scroll", {direction: 'down'});
      } catch (ign) {}
    });

    afterEach(async () => {
      await clickButton(driver, 'UICatalog');
      await B.delay(1000);
    });

    let axIdExt = (env.IOS8 || env.IOS9) ? '' : ', AAPLTextFieldViewController';

    it('should find only one element per text field', async () => {
      let el1 = await driver.findElement('accessibility id', `Text Fields${axIdExt}`);
      await driver.click(el1);
      B.delay(2000);
      let els = await driver.findElements('class name', 'UIATextField');
      els.should.have.length(4);
    });

    it('should find only one element per secure text field', async () => {
      let el1 = await driver.findElement('accessibility id', `Text Fields${axIdExt}`);
      await driver.click(el1);
      B.delay(2000);
      let els = await driver.findElements('class name', 'UIASecureTextField');
      els.should.have.length(1);
    });

  });

});
