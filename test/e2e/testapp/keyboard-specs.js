import setup from "../setup-base";
import desired from './desired';
import _ from 'lodash';
import env from '../helpers/env';
import unorm from 'unorm';


describe('testapp - keyboard', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  let test = function (strategy) {
    describe(`typing with strategy: ${strategy || 'undefined'}`, function () {
      // TODO: when sending 'Appium Rocks', autocompletion kicks in and
      //       messes up the test, investigate.
      let text = 'good morning';

      let session = setup(this, _.defaults({sendKeyStrategy: strategy}, desired));
      let driver = session.driver;

      it("should send keys to a text field", async () => {
        let env = await driver.execute('env');
        if (strategy) {
          env.sendKeyStrategy.should.equal(strategy);
        } else {
          env.sendKeyStrategy.should.equal(
            process.env.REAL_DEVICE ? 'grouped' : 'oneByOne');
        }
        let el = await driver.findElement('class name', 'UIATextField');
        await driver.clear(el);
        await driver.setValue(text, el);
        let text2 = await driver.getText(el);
        if (strategy === 'grouped') {
          text2.length.should.be.above(0);
        } else {
          text2.should.equal(text);
        }
      });
    });
  };

  _.each([undefined, 'oneByOne', 'grouped', 'setValue'], test);

  describe("typing", function () {
    let session = setup(this, desired);
    let driver = session.driver;

    describe("stability @skip-ci", function () {
      let runs = 10
        , text = 'Delhi is New @@@ BREAKFAST-FOOD-0001';

      let test = function () {
        it("should send keys to a text field", async () => {
          let el = await driver.findElement('class name', 'UIATextField');
          await driver.clear(el);
          driver.setValue(text, el);
          (await driver.getText(el)).should.equal(text);
        });
      };

      for (let n = 0; n < runs; n++) {
        describe(`sendKeys test ${n + 1}`, test);
      }
    });

    it('should send accented text', async () => {
      let testText = unorm.nfd("é Œ ù ḍ");
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.setValue(testText, el);
      (await driver.getText(el)).should.equal(testText);
    });

    it('should send backspace key', async () => {
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.setValue('abcd', el);
      (await driver.getText(el)).should.equal('abcd');
      await driver.setValue('\uE003\uE003', el);
      (await driver.getText(el)).should.equal('ab');
    });

    it('should send delete key', async () => {
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.setValue('abcd', el);
      await driver.setValue('\ue017\ue017', el);
      (await driver.getText(el)).should.equal('ab');
    });

    it('should send single quote text with setValue', async () => {
      let testText = "'";
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.setValue(testText, el);
      (await driver.getText(el)).should.equal(testText);
    });
    it('should send single quote text with keys', async () => {
      let testText = "'";
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.keys(testText);
      (await driver.getText(el)).should.equal(testText);
    });
    it('should send text with a newline', async () => {
      let testText = ['my string\n'];
      let els = await driver.findElements('class name', 'UIATextField');
      let el = els[1];
      await driver.clear(el);
      await driver.keys(testText);
      (await driver.getText(el)).should.equal('my string');
    });
  });
});
