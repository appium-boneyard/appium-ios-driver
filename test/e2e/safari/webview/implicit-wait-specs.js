import setup from '../setup-base';
import desired from './desired';

describe('safari - webview implicit wait @skip-ios6', () => {
  const driver = setup(this, desired, {'no-reset': true});

  it('should set the implicit wait for finding web elements', async () => {
    await driver.setImplicitWaitTimeout(7 * 1000);

    let before = new Date().getTime() / 1000;
    (await driver.elementByTagName('notgonnabethere')).should.be.rejectedWith(/status: 7/);

    let after = new Date().getTime() / 1000;
    ((after - before) > 7).should.be.ok;
    await driver.setImplicitWaitTimeout(0);
  });
});
