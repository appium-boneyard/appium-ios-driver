import setup from "../setup-base";
import env from '../helpers/env';
import { loadWebView, spinTitle } from "../helpers/webview";

describe('safari - windows and frames (`${env.DEVICE}`) @skip-ios6"', () => {
  const driver = setup(this, {
    browserName: 'safari',
    nativeWebTap: true,
    safariAllowPopups: true
  });

  describe('within webview', () => {
    beforeEach(() => loadWebView("safari", driver));

    it("should throw nosuchwindow if there's not one", () => {
      return driver.window('noexistman').should.be.rejectedWith(/status: 23/);
    });

    // unfortunately, iOS8 doesn't respond to the close() method on window
    // the way iOS7 does
    it("should be able to open and close windows @skip-ios8", async () => {
      await driver.elementById('blanklink').click();
      await spinTitle("I am another page title", driver);

      let handles = await driver.windowHandles();
      await driver.sleep(2000);
      await driver.close();
      await driver.sleep(3000);
      (await driver.windowHandles()).should.be.below(handles.length);
      await spinTitle("I am a page title", driver);
    });

    it('should be able to go back and forward', async () => {
      await driver.elementByLinkText('i am a link').click();
      await driver.elementById('only_on_page_2');
      await driver.back();
      await driver.elementById('i_am_a_textbox');
      await driver.forward();
      await driver.elementById('only_on_page_2');
    });

    // broken on real devices, see https://github.com/appium/appium/issues/5167
    it("should be able to open js popup windows with safariAllowPopups set to true @skip-real-device", async () => {
      await driver.elementByLinkText('i am a new window link').click();
      await spinTitle("I am another page title", driver, 30);
    });
  });
});

describe('safari - windows and frames (' + env.DEVICE + ') @skip-ios6 - without safariAllowPopups', () => {
  const driver = setup(this, {
    browserName: 'safari',
    safariAllowPopups: false
  });

  beforeEach(async () => await loadWebView("safari", driver));

  it("should not be able to open js popup windows with safariAllowPopups set to false", async () => {
    await driver.execute("window.open('/test/guinea-pig2.html', null);");
    (await spinTitle("I am another page title", driver, 15))
      .should.be.rejectedWith("Title never became 'I am another");
  });
});
