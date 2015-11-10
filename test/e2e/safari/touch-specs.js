import setup from "../setup-base";
import env from '../helpers/env';
import desired from './webview/desired';

const testEndpoint = env.TEST_END_POINT;

describe('touch', () => {
  const driver = setup(this, {
    browserName: "safari"
  }, {
    'no-reset': true
  });

  it('should flick element', async () => {
    await driver.get(testEndpoint(desired) + 'touch.html');
    await driver.elementById('flickElem');

    let l1 = await driver.getLocation();
    let dx = 30, dy = 30;

    await driver.elementById('flickElem');
    await driver.flick(dx, dy, 0);
    await driver.sleep(1000);

    let l2 = await driver.getLocation();

    // UI Atomation's flickFromTo() seems to be not prices enough.
    // And in most cases safari receives the last touchmove event
    // with the coordinates which are by one pixel less than desired
    // destination. Hence allow some deviation here.
    l2.x.should.be.within(l1.x + dx - 2, l1.x + dx + 2);
    l2.y.should.be.within(l1.y + dy - 2, l1.y + dy + 2);
  });
});
