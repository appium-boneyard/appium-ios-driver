import desired from './desired';
import setup from '../setup-base';
import { loadWebView } from '../helpers/webview';

describe('safari - webview - alerts @skip-ios6 @skip-real-device', function() {
  const driver = setup(this, desired, {'no-reset': true});
  beforeEach(async () => await loadWebView(desired, driver));

  it('should accept alert', async () => {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    (await driver.title()).should.include('I am a page title');
  });

  it('should dismiss alert', async () => {
    await driver.elementById('alert1').click();
    await driver.dismissAlert();
    (await driver.title()).should.include('I am a page title');
  });

  it('should get text of alert', async () => {
    await driver.elementById('alert1').click();
    (await driver.alertText()).should.include('I am an alert');
    await driver.dismissAlert();
  });

  it('should not get text of alert that closed', async () => {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    return driver.alertText().should.be.rejectedWith(/status: 27/);
  });

  it('should set text of prompt', async () => {
    await driver.elementById('prompt1').click();
    await driver.alertKeys('yes I do!');
    await driver.acceptAlert();

    let value = await driver.elementById('promptVal').getValue();
    // TODO: avoiding flaky test case where value is 'yes I dO'.
    value.toLowerCase().should.equal('yes i do!');
  });

  it('should fail to set text of alert @skip-chrome', async () => {
    await driver.elementById('alert1').click();
    return driver.alertKeys('yes I do!').should.be.rejectedWith(/status: 11/);
  });
});
