import setup from "../setup-base";
import desired from './desired';

describe('testapp - active', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should return active element', async () => {
    let els = await driver.findElements('class name', 'UIATextField');
    let el = els[1];

    let input = 1234567;
    await driver.setValue(input, el);
    await driver.click(el);

    let activeEl = await driver.active();
    let value = await driver.getAttribute('value', activeEl);
    parseInt(value, 10).should.equal(input);
  });
});
