import setup from "../setup-base";
import desired from './desired';
import { throwMatchableError } from '../helpers/recipes';
import B from 'bluebird';

describe('testapp - find element', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  describe('by id', function () {
    it('should first attempt to match accessibility id', async () => {
      let el = await driver.findElement('id', 'ComputeSumButton');
      (await driver.getAttribute('label', el)).should.equal('Compute Sum');
    });

    it('should attempt to match by string if no accessibility id matches', async () => {
      let el = await driver.findElement('id', 'Compute Sum');
      (await driver.getAttribute('label', el)).should.equal('Compute Sum');
    });

    it('should use a localized string if the id is a localization key', async () => {
      let el = await driver.findElement('id', 'main.button.computeSum');
      (await driver.getAttribute('label', el)).should.equal('Compute Sum');
    });

    it('should be able to return multiple matches', async () => {
      let els = await driver.findElements('id', 'TextField');
      els.length.should.be.greaterThan(1);
    });
  });

  it('should find a single element on the app', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    el.should.exist;
  });

  it('should not find any invalid elements on the app and throw error', async () => {
    await B.resolve(driver.findElement('class name', 'UIAButtonNotThere'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 7/);
  });

  it('should find alerts when they exist', async () => {
    let els = await driver.findElements('class name', 'UIAButton');
    await driver.click(els[1]);
    let alert = await driver.findElement('class name', 'UIAAlert');
    (await driver.findElementFromElement('accessibility id', 'OK', alert)).should.exist;
    (await driver.findElementFromElement('accessibility id', 'Cancel', alert)).should.exist;
    await driver.postDismissAlert();
  });

  it('should not find alerts when they dont exist', async () => {
    await B.resolve(driver.findElement('class name', 'UIAAlert'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 7/);
  });

  it('should get an error when strategy doesnt exist', async () => {
    await B.resolve(driver.findElement('css selector', 'UIAButton'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 32/);
  });

  it('should find all elements by class name in the app', async () => {
    let els = await driver.findElements('class name', 'UIAButton');
    [4, 7, 8].should.contain(els.length);
    els[0].should.exist;
  });

  it('should not find any elements on the app but fail gracefully', async () => {
    let els = await driver.findElements('class name', 'UIAButtonNotThere');
    els.should.have.length(0);
  });

  it('should find element by valid name', async () => {
    let el = await driver.findElement('accessibility id', 'ComputeSumButton');
    el.should.exist;
  });

  it('should not find element by invalid name but return respective error code', async () => {
    await B.resolve(driver.findElement('accessibility id', 'InvalidNameForElement'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 7/);
  });

  it('should find an element with accessibility id containing an apostrophe', async () => {
    let el = await driver.findElement('accessibility id', "Access'ibility");
    el.should.exist;
  });

  it('should not find element by incomplete class name but return respective error code', async () => {
    await B.resolve(driver.findElement('class name', 'notAValidReference'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 32/);
  });

  it('should find multiple elements by valid name', async () => {
    let els = await driver.findElements('accessibility id', 'AppElem');
    els.should.have.length(3);
  });

});
