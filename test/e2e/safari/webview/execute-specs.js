import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../../helpers/webview';

const SCROLL_INTO_VIEW = `return arguments[0].scrollIntoView(true);`;
const GET_RIGHT_INNERHTML = `return document.body.innerHTML.indexOf('I am some page content') > 0`;
const GET_WRONG_INNERHTML = `return document.body.innerHTML.indexOf('I am not some page content') > 0`;
const GET_ELEM_BY_TAGNAME = `return document.getElementsByTagName('a');`;

describe('safari - webview - execute @skip-ios6', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;
  beforeEach(async () => await loadWebView(desired, driver));

  it('should bubble up javascript errors', async () => {
    (await driver.execute(`'nan'--`)).should.be.rejectedWith(/status: (13|7)/);
  });

  it('should eval javascript', async () => {
    (await driver.execute('return 1')).should.become(1);
  });

  it('should not be returning hardcoded results', async () => {
    (await driver.execute('return 1+1')).should.become(2);
  });

  it(`should return nothing when you don't explicitly return`, async () => {
    (await driver.execute('1+1')).should.not.exist;
  });

  it('should execute code inside the web view', async () => {
    (await driver.execute(GET_RIGHT_INNERHTML)).should.be.ok;
    (await driver.execute(GET_WRONG_INNERHTML)).should.not.be.ok;
  });

  it('should convert selenium element arg to webview element', async () => {
    let el = await driver.elementById('useragent');
    await driver.execute(SCROLL_INTO_VIEW, [{'ELEMENT': el.value}]);
  });

  it('should catch stale or undefined element as arg', async () => {
    let el = await driver.elementById('useragent');
    return driver.execute(SCROLL_INTO_VIEW, [{'ELEMENT': (el.value + 1)}]).should.beRejected;
  });

  it('should be able to return multiple elements from javascript', async () => {
    let res = await driver.execute(GET_ELEM_BY_TAGNAME);
    res[0].value.should.exist;
  });
});
