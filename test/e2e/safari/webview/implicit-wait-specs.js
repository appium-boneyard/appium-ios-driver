import setup from '../../setup-base';
import desired from './desired';

describe('safari - webview implicit wait', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;

  it('should set the implicit wait for finding web elements', async () => {
    await driver.implicitWait(7 * 1000);

    let before = new Date().getTime() / 1000;
    let hasThrown = false;

    /**
     * we have to use try catch to actually halt the process here
     */
    try {
      await driver.findElement('tag name', 'notgonnabethere');
    } catch (e) {
      hasThrown = true;
    } finally {
      hasThrown.should.be.ok;
    }

    let after = new Date().getTime() / 1000;
    ((after - before) > 7).should.be.ok;
    await driver.implicitWait(0);
  });
});
