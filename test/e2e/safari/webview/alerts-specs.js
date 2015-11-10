import desired from './desired';
import setup from '../setup-base';
import { loadWebView } from '../helpers/webview';

describe('safari - webview - alerts @skip-ios6 @skip-real-device', () => {
  const driver = await setup(this, desired, {'no-reset': true});
  beforeEach(() => await loadWebView(desired, driver););

  it('should accept alert', () => {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    (await driver.title()).should.include('I am a page title')
  });

  it('should dismiss alert', () => {
    await driver.elementById('alert1').click();
    await driver.dismissAlert();
    (await driver.title()).should.include('I am a page title');
  });

  it('should get text of alert', () => {
    await driver.elementById('alert1').click();
    (await driver.alertText()).should.include('I am an alert');
    await driver.dismissAlert();
  });

  it('should not get text of alert that closed', () => {
    await driver.elementById('alert1').click();
    await driver.acceptAlert();
    return driver.alertText().should.be.rejectedWith(/status: 27/);
  });

  it('should set text of prompt', () => {
    await driver.elementById('prompt1').click();
    await driver.alertKeys('yes I do!');
    await driver.acceptAlert();

    let value = await driver.elementById('promptVal').getValue();
    // TODO: avoiding flaky test case where value is 'yes I dO'.
    value.toLowerCase().should.equal('yes i do!');
  });

  it('should fail to set text of alert @skip-chrome', () => {
    await driver.elementById('alert1').click();
    return driver.alertKeys('yes I do!').should.be.rejectedWith(/status: 11/);
  });
});
