import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import _ from 'lodash';
import { throwMatchableError } from '../helpers/recipes.js';

describe('uicatalog - find by xpath', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  describe('individual calls', function () {
    beforeEach(async function () {
      let el = await driver.findElement('xpath', "//UIAStaticText[contains(@label,'Buttons')]");
      await driver.click(el);
    });

    afterEach(async () => {
      let el = await driver.findElement('accessibility id', 'UICatalog');
      await driver.click(el);
      await B.delay(1000);
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
