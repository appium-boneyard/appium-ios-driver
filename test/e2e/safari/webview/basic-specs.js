import desired from './desired';
import setup from '../setup-base';
import { loadWebView, isChrome, spinTitle, spinWait, skip } from '../helpers/webview';

describe('safari - webview - basics @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should find a web element in the web view', async () => {
    (await driver.elementById('i_am_an_id')).should.exist;
  });

  it('should find multiple web elements in the web view', async () => {
    (await driver.elementsByTagName('a')).should.have.length.above(0);
  });

  it('should fail gracefully to find multiple missing web elements in the web view', async () => {
    (await driver.elementsByTagName('blar')).should.have.length(0);
  });

  it('should find element from another element', async () => {
    (await driver.elementByClassName('border').elementByXPath('>', './form'))
      .should.eventually.exist;
  });

  it('should be able to click links', async () => {
    await driver.elementByLinkText('i am a link').click();
    await spinTitle('I am another page title', driver);
  });

  it('should retrieve an element attribute', async () => {
    (await driver.elementById('i_am_an_id').getAttribute('id')).should.become('i_am_an_id');
    (await driver.elementById('i_am_an_id').getAttribute('blar')).should.not.exist;
  });

  it('should retrieve implicit attributes', async () => {
    let els = await driver.elementsByTagName('option');
    els.should.have.length(3);

    (await els[2].getAttribute('index')).should.become('2');
  });

  it('should retrieve an element text', async () => {
    (await driver.elementById('i_am_an_id').text()).should.become('I am a div');
  });

  it('should check if two elements are equals', async () => {
    let els = await Promise.all([
      driver.elementById('i_am_an_id'),
      driver.elementByTagName('div')
    ]);
    els[0].equals(els[1]).should.be.ok;
  });

  it('should return the page source', async () => {
    let source = await driver.source();
    source.should.include('<html');
    source.should.include('I am a page title');
    source.should.include('i appear 3 times');
    source.should.include('</html>');
  });

  it('should get current url', async () => {
    (await driver.url()).should.include('test/guinea-pig');
  });

  it('should send keystrokes to specific element', async () => {
    await driver.elementById('comments').clear();
    await driver.sendKeys('hello world')
    (await driver.getValue()).should.become('hello world');
  });

  it('should send keystrokes to active element', async () => {
    await driver.elementById('comments').clear();
    await driver.click();
    await driver.keys('hello world');
    await driver.elementById('comments');
    (await driver.getValue()).should.become('hello world');
  });

  it('should clear element', async () => {
    await driver.elementById('comments');
    await driver.sendKeys('hello world');
    (await driver.getValue()).should.have.length.above(0);
    (await driver.elementById('comments').clear().getValue()).should.become('');
  });

  it('should say whether an input is selected', async () => {
    (await driver.elementById('unchecked_checkbox').selected()).should.not.be.ok;
    (await driver.elementById('unchecked_checkbox').click().selected()).should.be.ok;
  });

  it('should be able to retrieve css properties', async () => {
    await driver.elementById('fbemail')
    (await driver.getComputedCss('background-color')).should.become('rgba(255, 255, 255, 1)');
  });

  it('should retrieve an element size', async () => {
    let size = await driver.elementById('i_am_an_id').getSize();
    size.width.should.be.above(0);
    size.height.should.be.above(0);
  });

  it('should get location of an element', async () => {
    let loc = await driver.elementById('fbemail').getLocation();
    loc.x.should.be.above(0);
    loc.y.should.be.above(0);
  });

  it('should retrieve tag name of an element', async () => {
    (await driver.elementById('fbemail').getTagName()).should.become('input');
    (await driver.elementByCss('a').getTagName()).should.become('a');
  });

  it('should retrieve a window size @skip-chrome', async () => {
    let size = await driver.getWindowSize();
    size.height.should.be.above(0);
    size.width.should.be.above(0);
  });

  it('should move to an arbitrary x-y element and click on it', async () => {
    await driver.elementByLinkText('i am a link').moveTo(5, 15).click();
    await spinTitle('I am another page title', driver);
  });

  it('should submit a form', async () => {
    await driver.elementById('comments').sendKeys('This is a comment').submit();
    await spinWait(function () {
      return driver
        .elementById('your_comments')
        .text()
        .should.become('Your comments: This is a comment');
    });
  });

  it('should return true when the element is displayed', async () => {
    (await driver.elementByLinkText('i am a link').isDisplayed()).should.be.ok;
  });

  it('should return false when the element is not displayed', async () => {
    (await driver.elementById('invisible div').isDisplayed()).should.not.be.ok;
  });

  it('should return true when the element is enabled', async () => {
    (await driver.elementByLinkText('i am a link').isEnabled()).should.be.ok;
  });

  it('should return false when the element is not enabled', async () => {
    await driver.execute(`$('#fbemail').attr('disabled', 'disabled');`);
    (await driver.elementById('fbemail').isEnabled()).should.not.be.ok;
  });

  it('should return the active element', async () => {
    var testText = 'hi there';
    await driver.elementById('i_am_a_textbox').sendKeys(testText);
    (await driver.active().getValue()).should.become(testText);
  });

  it('should properly navigate to anchor', async () => {
    let curl = await driver.url();
    await driver.get(curl);
  });

  it('should be able to refresh', async () => {
    await driver.refresh();
  });

  it('should be able to get performance logs', async () => {
    if (!isChrome(desired)) {
      return skip(`Performance logs aren't available except in Chrome`);
    }

    (await driver.logTypes()).should.include('performance');
    let logs = await driver.log('performance');
    logs.length.should.be.above(0);
  });
});
