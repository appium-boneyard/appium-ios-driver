import desired from './desired';
import setup from '../../setup-base';
import { loadWebView, testEndpoint } from '../../helpers/webview';

describe('safari - webview - iframes @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;

  beforeEach(async () => await loadWebView(
    desired,
    driver,
    testEndpoint(desired) + 'iframes.html',
    'Iframe guinea pig'
  ));

  it('should switch to iframe by name', async () => {
    await driver.setFrame('iframe1');
    (await driver.title()).should.be.equal('Iframe guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 1');
  });

  it('should switch to iframe by index', async () => {
    await driver.setFrame(1);
    (await driver.title()).should.be.equal('Iframe guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 2');
  });

  it('should switch to iframe by id', async () => {
    await driver.setFrame('id-iframe3');
    (await driver.title()).should.be.equal('Iframe guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 3');
  });

  it('should switch to iframe by element', async () => {
    let frame = await driver.findElement('id', 'id-iframe3');
    await driver.setFrame(frame);
    (await driver.title()).should.be.equal('Iframe guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 3');
  });

  it('should not switch to iframe by element of wrong type', async () => {
    let h1 = await driver.findElement('tag name', 'h1');
    (async () => await driver.setFrame(h1)).should.throw;
  });

  it('should switch back to default content from iframe', async () => {
    await driver.setFrame('iframe1');
    (await driver.title()).should.be.equal('Iframe guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 1');

    await driver.setFrame(null);
    (await driver.findElements('tag name', 'iframe')).should.have.length(3);
  });
});
