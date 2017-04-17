/* globals expect */
import desired from './desired';
import setup from '../safari-setup';
import { loadWebView, spinTitle, spinWait } from '../../helpers/webview';
import B from 'bluebird';
import { MOCHA_SAFARI_TIMEOUT } from '../../helpers/session';
import env from '../../helpers/env';


describe('safari - webview ', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  describe('basics', () => {
    const driver = setup(this, desired).driver;

    describe('context', function () {
      it('getting current context should work initially', async () => {
        await B.delay(500);
        (await driver.getCurrentContext()).should.be.ok;
      });
    });

    describe('implicit wait', function () {
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

    describe('window title', function () {
      beforeEach(async () => await loadWebView(desired, driver));

      it('should return a valid title on web view', async () => {
        (await driver.title()).should.include("I am a page title");
      });
    });

    describe('element handling', function () {
      beforeEach(async () => await loadWebView(desired, driver));

      it('should find a web element in the web view', async () => {
        (await driver.findElement('id', 'i_am_an_id')).should.exist;
      });

      it('should find multiple web elements in the web view', async () => {
        (await driver.findElements('tag name', 'a')).should.have.length.above(0);
      });

      it('should fail gracefully to find multiple missing web elements in the web view', async () => {
        (await driver.findElements('tag name', 'blar')).should.have.length(0);
      });

      it('should find element from another element', async () => {
        let el = await driver.findElement('class name', 'border');
        (await driver.findElementFromElement('xpath', './form', el)).should.exist;
      });

      it('should be able to click links', async () => {
        let el = await driver.findElement('link text', 'i am a link');
        await driver.click(el);
        await spinTitle('I am another page title', driver);
      });

      it('should retrieve an element attribute', async () => {
        let el = await driver.findElement('id', 'i_am_an_id');
        (await driver.getAttribute('id', el)).should.be.equal('i_am_an_id');
        expect(await driver.getAttribute('blar', el)).to.be.null;
      });

      it('should retrieve implicit attributes', async () => {
        let els = await driver.findElements('tag name', 'option');
        els.should.have.length(3);

        (await driver.getAttribute('index', els[2])).should.be.equal('2');
      });

      it('should retrieve an element text', async () => {
        let el = await driver.findElement('id', 'i_am_an_id');
        (await driver.getText(el)).should.be.equal('I am a div');
      });

      it.skip('should check if two elements are equals', async () => {
        let el1 = await driver.findElement('id', 'i_am_an_id');
        let el2 = await driver.findElement('css selector', '#i_am_an_id');
        el1.should.be.equal(el2);
      });

      it('should return the page source', async () => {
        let source = await driver.getPageSource();
        source.should.include('<html');
        source.should.include('I am a page title');
        source.should.include('i appear 3 times');
        source.should.include('</html>');
      });

      it('should get current url', async () => {
        (await driver.getUrl()).should.include('test/guinea-pig');
      });

      it('should get updated URL without breaking window handles', async () => {
        let el = await driver.findElement('link text', 'i am an anchor link');
        await driver.click(el);
        (await driver.getUrl()).should.contain('#anchor');
        (await driver.getWindowHandles()).should.be.ok;
      });

      it('should send keystrokes to specific element', async () => {
        let el = await driver.findElement('id', 'comments');
        await driver.clear(el);
        await driver.setValue('hello world', el);
        (await driver.getAttribute('value', el)).should.be.equal('hello world');
      });

      it('should send keystrokes to active element', async () => {
        let el = await driver.findElement('id', 'comments');
        await driver.clear(el);
        await driver.click(el);
        await driver.keys('hello world');
        (await driver.getAttribute('value', el)).should.be.equal('hello world');
      });

      it('should clear element', async () => {
        let el = await driver.findElement('id', 'comments');
        await driver.setValue('hello world', el);
        (await driver.getAttribute('value', el)).should.have.length.above(0);
        await driver.clear(el);
        (await driver.getAttribute('value', el)).should.be.equal('');
      });

      it('should say whether an input is selected', async () => {
        let el = await driver.findElement('id', 'unchecked_checkbox');
        (await driver.elementSelected(el)).should.not.be.ok;
        await driver.click(el);
        (await driver.elementSelected(el)).should.be.ok;
      });

      it('should be able to retrieve css properties', async () => {
        let el = await driver.findElement('id', 'fbemail');
        (await driver.getCssProperty('background-color', el.ELEMENT)).should.be.equal('rgba(255, 255, 255, 1)');
      });

      it('should retrieve an element size', async () => {
        let el = await driver.findElement('id', 'i_am_an_id');
        let size = await driver.getSize(el);
        size.width.should.be.above(0);
        size.height.should.be.above(0);
      });

      it('should get location of an element', async () => {
        let el = await driver.findElement('id', 'fbemail');
        let loc = await driver.getLocation(el);
        loc.x.should.be.above(0);
        loc.y.should.be.above(0);
      });

      /**
       * getTagName not supported by mjwp
       */
      it.skip('should retrieve tag name of an element', async () => {
        let el = await driver.findElement('id', 'fbemail');
        let a = await driver.findElement('css selector', 'a');
        (await driver.getTagName(el)).should.be.equal('input');
        (await driver.getTagName(a)).should.be.equal('a');
      });

      it('should retrieve a window size', async () => {
        let size = await driver.getWindowSize();
        size.height.should.be.above(0);
        size.width.should.be.above(0);
      });

      it('should move to an arbitrary x-y element and click on it', async () => {
        let el = await driver.findElement('link text', 'i am a link');
        await driver.moveTo(el, 5, 15);
        await driver.click(el);
        await spinTitle('I am another page title', driver);
      });

      it('should submit a form', async () => {
        let el = await driver.findElement('id', 'comments');
        let form = await driver.findElement('id', 'jumpContact');
        await driver.setValue('This is a comment', el);
        await driver.submit(form.ELEMENT);
        await spinWait(async () => {
          let el = await driver.findElement('id', 'your_comments');
          (await driver.getText(el)).should.be.equal('Your comments: This is a comment');
        });
      });

      it('should return true when the element is displayed', async () => {
        let el = await driver.findElement('link text', 'i am a link');
        (await driver.elementDisplayed(el)).should.be.ok;
      });

      it('should return false when the element is not displayed', async () => {
        let el = await driver.findElement('id', 'invisible div');
        (await driver.elementDisplayed(el)).should.not.be.ok;
      });

      it('should return true when the element is enabled', async () => {
        let el = await driver.findElement('link text', 'i am a link');
        (await driver.elementEnabled(el)).should.be.ok;
      });

      it('should return false when the element is not enabled', async () => {
        let el = await driver.findElement('id', 'fbemail');
        await driver.execute(`$('#fbemail').attr('disabled', 'disabled');`);
        (await driver.elementEnabled(el)).should.not.be.ok;
      });

      it('should return the active element', async () => {
        var testText = 'hi there';
        let el = await driver.findElement('id', 'i_am_a_textbox');
        await driver.setValue(testText, el);
        let activeEl = await driver.active();
        (await driver.getAttribute('value', activeEl)).should.be.equal(testText);
      });

      it('should properly navigate to anchor', async () => {
        let curl = await driver.getUrl();
        await driver.setUrl(curl);
      });

      it('should be able to refresh', async () => {
        await driver.refresh();
      });
    });
  });

  describe('safariIgnoreFraudWarning', function () {
    describe('true', function () {
      let specialCaps = Object.assign({}, desired);
      specialCaps.safariIgnoreFraudWarning = true;

      const driver = setup(this, specialCaps).driver;
      before(async () => await loadWebView(specialCaps, driver));

      // iOS8 currently does not disable the phishing warning for foo:bar@ type
      // addresses, even when running the sim manually
      // TODO: find another way to trigger the phishing warning that IS disabled
      // by the pref on iOS8
      it('should not display a phishing warning with safariIgnoreFraudWarning @skip-ios8', async () => {
        await driver.setUrl(env.PHISHING_END_POINT + 'guinea-pig2.html');
        await spinWait(async () => {
          (await driver.getTitle()).should.contain("I am another page title");
        });
      });
    });

    describe('false', function () {
      let specialCaps = Object.assign({}, desired);
      specialCaps.safariIgnoreFraudWarning = false;

      const driver = setup(this, specialCaps).driver;
      before(async () => await loadWebView(specialCaps, driver));

      // iOS8 currently does not disable the phishing warning for foo:bar@ type
      // addresses, even when running the sim manually
      // TODO: find another way to trigger the phishing warning that IS disabled
      // by the pref on iOS8
      it('should display a phishing warning with safariIgnoreFraudWarning @skip-ios8', async () => {
        await driver.setUrl(env.PHISHING_END_POINT + 'guinea-pig2.html');
        await spinWait(async () => {
          (await driver.getTitle()).toLowerCase().should.contain("phishing");
        });
      });
    });
  });
});
