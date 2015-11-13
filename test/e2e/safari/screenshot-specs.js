import setup from "../setup-base";

describe('safari - screenshots @skip-ios6', function() {
  describe('default' ,function() {
    const driver = setup(this, { browserName: 'safari' }).driver;

    it('should get an app screenshot', async () => {
      (await driver.takeScreenshot()).should.exist;
    });

    // TODO: fails in ci env, investigate
    it('should get an app screenshot in landscape mode @skip-ci', async () => {
      let screenshot1 = (await driver.takeScreenshot());
      screenshot1.should.exist;

      try {
        await driver.setOrientation("LANDSCAPE");
      } catch (e) {
        // A useless error does often exist here, let's ignore it
      }

      let screenshot2 = await driver.takeScreenshot();
      screenshot2.should.exist;
      screenshot2.should.not.eql(screenshot1);

      // cooldown
      await driver.sleep();
    });
  });

  describe('setting screenshotWaitTimeout', function() {
    const driver = setup(this, {
      browserName: 'safari',
      screenshotWaitTimeout: 5
    }).driver;

    it('should get an app screenshot', async () => {
      (await driver.takeScreenshot()).should.exist;
    });
  });

});
