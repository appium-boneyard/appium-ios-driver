import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import _ from 'lodash';
import { clickButton, throwMatchableError, filterDisplayed,
         filterVisibleUiaSelector } from '../helpers/recipes';


const byUIA = '-ios uiautomation';

describe('uicatalog - find -', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  describe('basics', function () {
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

  describe('by accessibility id', function () {
    afterEach(async () => {
      await clickButton(driver, 'UICatalog');
    });

    it('should find an element by name beneath another element', async () => {
      let axIdExt = env.IOS8 || env.IOS9 ? '' : ', AAPLActionSheetViewController';
      let el = await driver.findElement('accessibility id', "UICatalog");
      await driver.click(el);
      let el2 = await driver.findElement('accessibility id', `Action Sheets${axIdExt}`);
      el2.should.exist;
    });
  });

  describe('by ui automation', function () {
    before(async () => {
      let el = await driver.findElement(byUIA, '.navigationBars()[0]');
      if ((await driver.getAttribute('name', el)) !== 'UICatalog') {
        await clickButton(driver, 'UICatalog');
      }
      await B.delay(500);
    });

    it('should process most basic UIAutomation query', async () => {
      let els = await driver.findElements(byUIA, '.elements()');
      let displayedEls = await filterDisplayed(driver, els);
      displayedEls.should.have.length(2);
    });

    it('should use raw selector code if selector does not start with a dot', async () => {
      let els = await driver.findElements(byUIA, '$.mainWindow().elements()');
      let displayedEls = await filterDisplayed(driver, els);
      displayedEls.should.have.length(2);
    });

    it('should get a single element', async () => {
      let el = await driver.findElement(byUIA, '.elements()[0]');
      (await driver.getAttribute('name', el)).should.equal('UICatalog');
    });

    it('should get a single element with non-zero index', async () => {
      let name = env.IOS8 || env.IOS9 ? '' : 'Empty list';
      let el = await driver.findElement(byUIA, '.elements()[1]');
      (await driver.getAttribute('name', el)).should.equal(name);
    });

    it('should get single element as array', async () => {
      let els = await driver.findElements(byUIA, '.tableViews()[0]');
      els.should.have.length(1);
    });

    it('should find elements by index multiple times', async () => {
      let el = await driver.findElement(byUIA, '.elements()[1].cells()[2]');
      (await driver.getAttribute('name', el)).should.include('Alert Views');
    });

    it('should find element by name', async () => {
      let el = await driver.findElement(byUIA, '.elements()["UICatalog"]');
      (await driver.getAttribute('name', el)).should.equal('UICatalog');
    });

    it('should find element by type and index', async () => {
      let el = await driver.findElement(byUIA, '.navigationBar().elements()[1]');
      (await driver.getAttribute('name', el)).should.equal('Back');
    });

    describe('start from a given context instead of root target', function () {
      it('should process a simple query', async () => {
        let el = await driver.findElement(byUIA, '.elements()[1]');
        let els = await driver.findElementsFromElement(byUIA, filterVisibleUiaSelector('.elements();'), el);
        els.should.have.length.at.least(10);
      });

      it('should find element by name', async () => {
        let axIdExt = env.IOS8 || env.IOS9 ? "" : ", AAPLButtonViewController";
        let el1 = await driver.findElement(byUIA, '.elements()[1]');
        let el2 = await driver.findElementFromElement(byUIA, `.elements()["Buttons${axIdExt}"]`, el1);
        el2.should.exist;
      });
    });
  });

  describe('by xpath', function () {
    describe('individual calls', function () {
      before(async () => {
        // before anything, try to go back
        try {
          let el = await driver.findElement(byUIA, '.navigationBar().elements()[1]');
          await driver.click(el);
        } catch (ign) {}
        // and make sure we are at the top of the page
        try {
          await driver.execute("mobile: scroll", {direction: 'up'});
        } catch (ign) {}
      });
      beforeEach(async function () {
        // go into the right page
        let el = await driver.findElement('xpath', "//UIAStaticText[contains(@label,'Buttons')]");
        await driver.click(el);
      });
      afterEach(async function () {
        // go back
        let el = await driver.findElement(byUIA, '.navigationBar().elements()[1]');
        await driver.click(el);
      });

      it('should respect implicit wait', async () => {
        await driver.implicitWait(5000);

        let begin = Date.now();
        await driver.findElement('xpath', "//something_not_there")
          .should.eventually.be.rejected;
        let end = Date.now();
        (end - begin).should.be.above(5000);
      });

      it('should return the last button', async () => {
        let el = await driver.findElement('xpath', "//UIAButton[last()]");
        (await driver.getText(el)).should.equal("Button"); // this is the name of the last button
      });

      it('should return a single element', async () => {
        let el = await driver.findElement('xpath', "//UIAButton");
        (await driver.getText(el)).should.equal("UICatalog");
      });

      it('should return multiple elements', async () => {
        let els = await driver.findElements('xpath', "//UIAButton");
        els.should.have.length.above(5);
      });

      it('should filter by name', async () => {
        let el = await driver.findElement('xpath', "//UIAButton[@name='X Button']");
        (await driver.getText(el)).should.equal("X Button");
      });

      it('should know how to restrict root-level elements', async () => {
        await B.resolve(driver.findElement('xpath', "/UIAButton"))
          .catch(throwMatchableError)
          .should.be.rejectedWith(/jsonwpCode: 7/);
      });

      it('should search an extended path by child', async () => {
        let el = await driver.findElement('xpath', "//UIANavigationBar/UIAStaticText");
        (await driver.getText(el)).should.equal('Buttons');
      });

      it('should search an extended path by descendant', async () => {
        let els = await driver.findElements('xpath', "//UIATableCell//UIAButton");
        let texts = await B.all(_.map(els, (el) => { return driver.getText(el); }));
        texts.should.not.include("UICatalog");
        texts.should.include("X Button");
      });

      it('should filter by indices', async () => {
        await driver.implicitWait(10000);
        let el = await driver.findElement('xpath', "//UIATableCell[4]/UIAButton[1]");
        (await driver.getAttribute('name', el)).should.equal('X Button');
      });

      it('should filter by partial text', async () => {
        let el = await driver.findElement('xpath', "//UIATableCell//UIAButton[contains(@name, 'X ')]");
        (await driver.getText(el)).should.equal("X Button");
      });

      it('should find an element within itself', async () => {
        let e1 = await driver.findElement('xpath', "//UIATableCell[@name='X Button']");
        let e2 = await driver.findElementFromElement('xpath', "//UIAButton[1]", e1);
        (await driver.getText(e2)).should.equal("X Button");
      });
    });

    describe('duplicate text field', function () {
      beforeEach(async () => {
        let el = await driver.findElement('accessibility id', 'Text Fields');
        await driver.click(el);
        await B.delay(2000);
      });

      afterEach(async () => {
        let el = await driver.findElement('accessibility id', 'UICatalog');
        await driver.click(el);
        await B.delay(1000);
      });

      it('should find only one text field', async () => {
        let els = await driver.findElements('xpath', '//UIATableView["Empty list"]/UIATableCell[1]/UIATextField');
        els.should.have.length(1);
      });

      it('should find only one text field when doing relative search', async () => {
        let el2 = await driver.findElement('xpath', '//UIATableView["Empty list"]');
        let els = await driver.findElementsFromElement('xpath', '//UIATableCell[1]/UIATextField', el2);
        els.should.have.length(1);
      });

      it('should find only one secure text field', async () => {
        let els = await driver.findElements('xpath', '//UIATableView["Empty list"]/UIATableCell[3]/UIASecureTextField');
        els.should.have.length(1);
      });

    });

    describe('multiple calls', function () {
      let runs = 5;

      let test = function (path, minLength) {
        return function () {
          it('should not crash', async () => {
            let els = await driver.findElements('xpath', path);
            els.should.have.length.above(minLength);
          });
        };
      };

      describe('finding specific path', function () {
        for (let n = 0; n < runs; n++) {
          describe(`test ${n + 1}`, test("//UIAApplication[1]/UIAWindow/UIATableView/UIATableCell", 17));
        }
      });

      describe('finding //*', function () {
        for (let n = 0; n < runs; n++) {
          describe(`test ${n + 1}`, test("//*", 52));
        }
      });
    });
  });
});
