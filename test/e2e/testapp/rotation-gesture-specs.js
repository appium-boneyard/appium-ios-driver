import setup from "../setup-base";
import desired from './desired';
import { okIfAlert } from '../helpers/recipes';
import B from 'bluebird';

describe('testapp - rotation gesture', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  before(async () => {
    let buttons = await driver.findElements('class name', 'UIAButton');
    await driver.click(buttons[5]);

    await B.delay(1000);
    await okIfAlert(driver);
  });

  it('should rotate map with coordinates', async () => {
    await driver.mobileRotation(114, 198, 3, 220, 2, 5);
    await B.delay(2000);

    await driver.mobileRotation(114, 198, 3, 0, 2, 5);
    await B.delay(1000);
  });

  it('should rotate map with element', async () => {
    let map = await driver.findElement('class name', 'UIAMapView');
    await driver.mobileRotation(undefined, undefined, 3, -220, 2, 5, map);
    await B.delay(2000);

    await driver.mobileRotation(undefined, undefined, 3, 0, 2, 5, map);
    await B.delay(1000);
  });
});
