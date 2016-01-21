import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import { clickButton, filterDisplayed, filterVisibleUiaSelector } from '../helpers/recipes';
//  , filterVisible = require('../../../helpers/ios-uiautomation').filterVisible;

describe('uicatalog - find by ios-ui-automation', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  let byUIA = '-ios uiautomation';

  before(async () => {
    let el = await driver.findElement(byUIA, '.navigationBars()[0]');
    if((await driver.getAttribute('name', el)) !== 'UICatalog') {
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
