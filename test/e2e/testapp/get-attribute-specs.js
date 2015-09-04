import setup from "../setup-base";
import desired from './desired';

describe('testapp - get attribute', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should get element attribute', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    (await driver.getAttribute('name', el)).should.equal("ComputeSumButton");
  });
});
