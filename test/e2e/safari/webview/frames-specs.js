import desired from './desired';
import setup from '../setup-base';
import { loadWebView, testEndpoint } from '../helpers/webview';

const GET_ELEM_SYNC = `return document.getElementsByTagName('h1')[0].innerHTML;`;
const GET_ELEM_ASYNC = `arguments[arguments.length - 1](document.getElementsByTagName('h1')[0].innerHTML);`;

describe('safari - webview - frames @skip-ios6', () => {
  const driver = await setup(this, desired, {'no-reset': true});

  beforeEach(() => await loadWebView(
    desired,
    driver,
    testEndpoint(desired) + 'frameset.html',
    'Frameset guinea pig'
  ).frame(););

  it('should switch to frame by name', () => {
    await driver.frame('first');
    (await driver.title()).should.become('Frameset guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 1');
  });

  it('should switch to frame by index', () => {
    await driver.frame(1);
    (await driver.title()).should.become('Frameset guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 2');
  });

  it('should switch to frame by id', () => {
    await driver.frame('frame3');
    (await driver.title()).should.become('Frameset guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 3');
  });

  it('should switch back to default content from frame', () => {
    await driver.frame('first');
    (await driver.title()).should.become('Frameset guinea pig');
    (await driver.elementByTagName('h1').text()).should.become('Sub frame 1');

    await driver.frame(null);
    (await driver.elementByTagName('frameset')).should.exist;
  });

  it('should switch to child frames', () => {
    await driver.frame('third');
    (await driver.title()).should.become('Frameset guinea pig');

    await driver.frame('childframe');
    (await driver.elementById('only_on_page_2')).should.exist;
  });

  it('should execute javascript in frame', () => {
    await driver.frame('first');
    (await driver.execute(GET_ELEM_SYNC)).should.become('Sub frame 1');
  });

  it('should execute async javascript in frame', () => {
    await driver.frame('first');
    (await driver.executeAsync(GET_ELEM_ASYNC)).should.become('Sub frame 1');
  });
});
