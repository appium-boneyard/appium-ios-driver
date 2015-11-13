import desired from './desired';
import setup from '../setup-base';
import { loadWebView, testEndpoint } from '../helpers/webview';

describe('safari - webview - iframes @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;

  beforeEach(async () => await loadWebView(
    desired,
    driver,
    testEndpoint(desired) + 'iframes.html',
    'Iframe guinea pig'
  ).frame());

  it('should switch to iframe by name', async () => {
    await driver.frame('iframe1');
    (await driver.title()).should.become('Iframe guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 1');
  });

  it('should switch to iframe by index', async () => {
    await driver.frame(1);
    (await driver.title()).should.become('Iframe guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 2');
  });

  it('should switch to iframe by id', async () => {
    await driver.frame('id-iframe3');
    (await driver.title()).should.become('Iframe guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 3');
  });

  it('should switch to iframe by element', async () => {
    let frame = await driver.elementById('id-iframe3');
    await driver.frame(frame);
    (await driver.title()).should.become('Iframe guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 3');
  });

  it('should not switch to iframe by element of wrong type', async () => {
    let h1 = await driver.elementByTagName('h1');
    (await driver.frame(h1)).should.be.rejectedWith(/status: 8/);
  });

  it('should switch back to default content from iframe', async () => {
    await driver.frame('iframe1');
    (await driver.title()).should.become('Iframe guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 1');

    await driver.frame(null);
    (await driver.elementsByTagName('iframe')).should.have.length(3);
  });
});
