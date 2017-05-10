/* globals expect */
import desired from './desired';
import setup from '../safari-setup';
import { loadWebView } from '../../helpers/webview';
import { MOCHA_SAFARI_TIMEOUT } from '../../helpers/session';


const SCROLL_INTO_VIEW = `return arguments[0].scrollIntoView(true);`;
const GET_RIGHT_INNERHTML = `return document.body.innerHTML.indexOf('I am some page content') > 0`;
const GET_WRONG_INNERHTML = `return document.body.innerHTML.indexOf('I am not some page content') > 0`;
const GET_ELEM_BY_TAGNAME = `return document.getElementsByTagName('a');`;

describe('safari - webview - execute', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  describe('http', function () {
    const driver = setup(this, desired).driver;
    before(async () => await loadWebView(desired, driver));
    after(async function () {
      await driver.deleteSession();
    });

    describe('synchronous', function () {
      it('should bubble up javascript errors', async () => {
        await driver.execute(`'nan'--`).should.eventually.be.rejected;
      });

      it('should eval javascript', async () => {
        (await driver.execute('return 1')).should.be.equal(1);
      });

      it('should not be returning hardcoded results', async () => {
        (await driver.execute('return 1+1')).should.be.equal(2);
      });

      it(`should return nothing when you don't explicitly return`, async () => {
        expect(await driver.execute('1+1')).to.not.exist;
      });

      it('should execute code inside the web view', async () => {
        (await driver.execute(GET_RIGHT_INNERHTML)).should.be.ok;
        (await driver.execute(GET_WRONG_INNERHTML)).should.not.be.ok;
      });

      it('should convert selenium element arg to webview element', async () => {
        let el = await driver.findElement('id', 'useragent');
        await driver.execute(SCROLL_INTO_VIEW, [el]);
      });

      it('should catch stale or undefined element as arg', async () => {
        let el = await driver.findElement('id', 'useragent');
        return driver.execute(SCROLL_INTO_VIEW, [{'ELEMENT': (el.value + 1)}]).should.beRejected;
      });

      it('should be able to return multiple elements from javascript', async () => {
        let res = await driver.execute(GET_ELEM_BY_TAGNAME);
        expect(res).to.have.length.above(0);
      });
      it('should pass along non-element arguments', async () => {
        let arg = 'non-element-argument';
        (await driver.execute('var args = Array.prototype.slice.call(arguments, 0); return args[0];', [arg])).should.be.equal(arg);
      });
      it('should handle return values correctly', async () => {
        let arg = ['one', 'two', 'three'];
        (await driver.execute('var args = Array.prototype.slice.call(arguments, 0); return args;', arg)).should.eql(arg);
      });
    });

    describe('asynchronous', function () {
      it('should bubble up javascript errors', async () => {
        await driver.execute(`'nan'--`).should.eventually.be.rejected;
      });

      it('should execute async javascript', async () => {
        await driver.asyncScriptTimeout(1000);
        (await driver.executeAsync(`arguments[arguments.length - 1](123);`)).should.be.equal(123);
      });

      it('should timeout when callback is not invoked', async () => {
        await driver.asyncScriptTimeout(1000);
        await driver.executeAsync(`return 1 + 2`).should.eventually.be.rejected;
      });
    });
  });

  describe('https', function () {
    const driver = setup(this, Object.assign({}, desired, {enableAsyncExecuteFromHttps: true})).driver;
    before(async () => await loadWebView(desired, driver, 'https://www.google.com', 'Google'));
    after(async function () {
      await driver.deleteSession();
    });

    describe('synchronous', function () {
      it('should bubble up javascript errors', async () => {
        await driver.execute(`'nan'--`).should.eventually.be.rejected;
      });

      it('should eval javascript', async () => {
        (await driver.execute('return 1')).should.be.equal(1);
      });

      it('should not be returning hardcoded results', async () => {
        (await driver.execute('return 1+1')).should.be.equal(2);
      });

      it(`should return nothing when you don't explicitly return`, async () => {
        expect(await driver.execute('1+1')).to.not.exist;
      });

      it('should pass along non-element arguments', async () => {
        let arg = 'non-element-argument';
        (await driver.execute('var args = Array.prototype.slice.call(arguments, 0); return args[0];', [arg])).should.be.equal(arg);
      });

      it('should handle return values correctly', async () => {
        let arg = ['one', 'two', 'three'];
        (await driver.execute('var args = Array.prototype.slice.call(arguments, 0); return args;', arg)).should.eql(arg);
      });
    });

    describe('asynchronous', function () {
      it('should bubble up javascript errors', async () => {
        await driver.execute(`'nan'--`).should.eventually.be.rejected;
      });

      it('should execute async javascript', async () => {
        await driver.asyncScriptTimeout(1000);
        (await driver.executeAsync(`arguments[arguments.length - 1](123);`)).should.be.equal(123);
      });

      it('should timeout when callback is not invoked', async () => {
        await driver.asyncScriptTimeout(1000);
        await driver.executeAsync(`return 1 + 2`).should.eventually.be.rejected;
      });
    });
  });
});
