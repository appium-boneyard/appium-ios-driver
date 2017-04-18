import setup from './safari-setup';
import env from '../helpers/env';
import B from 'bluebird';
import { MOCHA_SAFARI_TIMEOUT } from '../helpers/session';


/**
 * touch command doesn't work
 */
describe.skip('touch', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  const driver = setup(this, {
    browserName: "safari"
  }).driver;

  it('should flick element', async () => {
    await driver.setUrl(`${env.TEST_END_POINT}touch.html`);
    let flickElem = await driver.findElement('id', 'flickElem');

    let l1 = await driver.getLocation(flickElem);
    let dx = 30, dy = 30;

    flickElem = await driver.findElement('id', 'flickElem');
    await driver.flick(flickElem, dx, dy, 0);
    await B.delay(1000);

    let l2 = await driver.getLocation(flickElem);

    // UI Atomation's flickFromTo() seems to be not prices enough.
    // And in most cases safari receives the last touchmove event
    // with the coordinates which are by one pixel less than desired
    // destination. Hence allow some deviation here.
    l2.x.should.be.within(l1.x + dx - 2, l1.x + dx + 2);
    l2.y.should.be.within(l1.y + dy - 2, l1.y + dy + 2);
  });

  it('should not be able to do native touch actions', async () => {
    let el = await driver.findElement('id', 'comments');
    let gestures = [
      {action: 'press', options: {element: el}},
      {action: 'release'}
    ];
    await driver.performTouch(gestures).should.eventually.be.rejected;
  });
});
