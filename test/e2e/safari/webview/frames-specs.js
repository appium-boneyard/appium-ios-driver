import desired from './desired';
import setup from '../../setup-base';
import { loadWebView } from '../../helpers/webview';
import env from '../../helpers/env';


const GET_ELEM_SYNC = `return document.getElementsByTagName('h1')[0].innerHTML;`;
const GET_ELEM_ASYNC = `arguments[arguments.length - 1](document.getElementsByTagName('h1')[0].innerHTML);`;

describe('safari - webview - frames @skip-ios6 @skip-ci', function() {
  const driver = setup(this, desired, {'no-reset': true}).driver;

  beforeEach(async () => await loadWebView(
    desired,
    driver,
    `${env.TEST_END_POINT}frameset.html`,
    'Frameset guinea pig'
  ));

  it('should switch to frame by name', async () => {
    await driver.setFrame('first');
    (await driver.title()).should.be.equal('Frameset guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 1');
  });

  it('should switch to frame by index', async () => {
    await driver.setFrame(1);
    (await driver.title()).should.be.equal('Frameset guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 2');
  });

  it('should switch to frame by id', async () => {
    await driver.setFrame('frame3');
    (await driver.title()).should.be.equal('Frameset guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 3');
  });

  it('should switch back to default content from frame', async () => {
    await driver.setFrame('first');
    (await driver.title()).should.be.equal('Frameset guinea pig');

    let h1 = await driver.findElement('tag name', 'h1');
    (await driver.getText(h1)).should.be.equal('Sub frame 1');

    await driver.setFrame(null);
    (await driver.findElement('tag name', 'frameset')).should.exist;
  });

  it('should switch to child frames', async () => {
    await driver.setFrame('third');
    (await driver.title()).should.be.equal('Frameset guinea pig');

    await driver.setFrame('childframe');
    (await driver.findElement('id', 'only_on_page_2')).should.exist;
  });

  it('should execute javascript in frame', async () => {
    await driver.setFrame('first');
    (await driver.execute(GET_ELEM_SYNC)).should.be.equal('Sub frame 1');
  });

  it('should execute async javascript in frame', async () => {
    await driver.setFrame('first');
    (await driver.executeAsync(GET_ELEM_ASYNC)).should.be.equal('Sub frame 1');
  });
});
