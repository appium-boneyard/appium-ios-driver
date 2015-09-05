import setup from "../setup-base";
import desired from './desired';
import { filterVisibleUiaSelector } from '../helpers/recipes';

describe('testapp - simple', function () {

  describe('using calc app', function () {
    let session = setup(this, desired);
    let driver = session.driver;
    let byUIA = '-ios uiautomation';

    let values = [];
    let populate = async () => {
      let els = await driver.findElements(byUIA, filterVisibleUiaSelector('.textFields();'));
      for (let el of els) {
        let val = Math.round(Math.random() * 10);
        values.push(val);
        await driver.setValue(val, el);
      }
    };

    it('should fill two fields with numbers', async () => {
      await populate();
      let el1 = await driver.findElement('class name', 'UIAButton');
      await driver.click(el1);
      let el2 = await driver.findElement('class name', 'UIAStaticText');
      let result = parseInt(await driver.getText(el2), 10);
      result.should.equal(values[0] + values[1]);
    });
  });
});
