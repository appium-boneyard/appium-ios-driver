import setup from './safari-setup';
import env from '../helpers/env';
import { loadWebView, spinTitle } from "../helpers/webview";
import B from 'bluebird';
import { MOCHA_SAFARI_TIMEOUT } from '../helpers/session';


describe(`safari - windows and frames (${env.DEVICE})`, function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  const driver = setup(this, {
    browserName: 'safari',
    nativeWebTap: true,
    safariAllowPopups: true,
  }).driver;

  describe('within webview', function () {
    before(async function () {
      // minimize waiting if something goes wrong
      await driver.implicitWait(1000);
    });
    beforeEach(function () { return loadWebView("safari", driver); });

    it("should throw nosuchwindow if there's not one", function () {
      return driver.setWindow('noexistman').should.be.rejectedWith(/window could not be found/);
    });

    // unfortunately, iOS8 doesn't respond to the close() method on window
    // the way iOS7 does
    it("should be able to open and close windows @skip-ios8", async function () {
      let el = await driver.findElement('id', 'blanklink');
      await driver.click(el);
      await spinTitle("I am another page title", driver);

      await B.delay(2000);
      await driver.closeWindow();
      await B.delay(3000);
      await spinTitle("I am a page title", driver);
    });

    it('should be able to go back and forward', async function () {
      let link = await driver.findElement('link text', 'i am a link');
      await driver.click(link);
      await driver.findElement('id', 'only_on_page_2');
      await driver.back();
      await driver.findElement('id', 'i_am_a_textbox');
      await driver.forward();
      await driver.findElement('id', 'only_on_page_2');
    });

    // broken on real devices, see https://github.com/appium/appium/issues/5167
    it("should be able to open js popup windows with safariAllowPopups set to true @skip-real-device", async function () {
      let link = await driver.findElement('link text', 'i am a new window link');
      await driver.click(link);
      await spinTitle("I am another page title", driver, 30);
    });
  });
});

describe(`safari - windows and frames (${env.DEVICE}) - without safariAllowPopups`, function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  const driver = setup(this, {
    browserName: 'safari',
    safariAllowPopups: false
  }).driver;

  before(async function () {
    // minimize waiting if something goes wrong
    await driver.implicitWait(5000);
  });
  beforeEach(async function () { return await loadWebView("safari", driver); });

  it("should not be able to open js popup windows", async function () {
    await driver.execute("window.open('/test/guinea-pig2.html', null)");
    await spinTitle("I am another page title", driver, 5).should.eventually.be.rejected;
  });
});
