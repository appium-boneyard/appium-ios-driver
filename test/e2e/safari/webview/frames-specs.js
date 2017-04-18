import desired from './desired';
import setup from '../safari-setup';
import { loadWebView } from '../../helpers/webview';
import env from '../../helpers/env';
import { MOCHA_SAFARI_TIMEOUT } from '../../helpers/session';


const GET_ELEM_SYNC = `return document.getElementsByTagName('h1')[0].innerHTML;`;
const GET_ELEM_ASYNC = `arguments[arguments.length - 1](document.getElementsByTagName('h1')[0].innerHTML);`;

describe('safari - webview - frames', function () {
  this.timeout(MOCHA_SAFARI_TIMEOUT);

  const driver = setup(this, desired).driver;

  describe('frames', function () {
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

  describe('iframes', function () {
    beforeEach(async () => await loadWebView(
      desired,
      driver,
      `${env.TEST_END_POINT}iframes.html`,
      'Iframe guinea pig'
    ));

    it('should switch to iframe by name', async () => {
      await driver.setFrame('iframe1');
      (await driver.title()).should.be.equal('Iframe guinea pig');

      let h1 = await driver.findElement('tag name', 'h1');
      (await driver.getText(h1)).should.be.equal('Sub frame 1');
    });

    it('should switch to iframe by index', async () => {
      await driver.setFrame(1);
      (await driver.title()).should.be.equal('Iframe guinea pig');

      let h1 = await driver.findElement('tag name', 'h1');
      (await driver.getText(h1)).should.be.equal('Sub frame 2');
    });

    it('should switch to iframe by id', async () => {
      await driver.setFrame('id-iframe3');
      (await driver.title()).should.be.equal('Iframe guinea pig');

      let h1 = await driver.findElement('tag name', 'h1');
      (await driver.getText(h1)).should.be.equal('Sub frame 3');
    });

    it('should switch to iframe by element', async () => {
      let frame = await driver.findElement('id', 'id-iframe3');
      await driver.setFrame(frame);
      (await driver.title()).should.be.equal('Iframe guinea pig');

      let h1 = await driver.findElement('tag name', 'h1');
      (await driver.getText(h1)).should.be.equal('Sub frame 3');
    });

    it('should not switch to iframe by element of wrong type', async () => {
      let h1 = await driver.findElement('tag name', 'h1');
      await driver.setFrame(h1).should.eventually.be.rejected;
    });

    it('should switch back to default content from iframe', async () => {
      await driver.setFrame('iframe1');
      (await driver.title()).should.be.equal('Iframe guinea pig');

      let h1 = await driver.findElement('tag name', 'h1');
      (await driver.getText(h1)).should.be.equal('Sub frame 1');

      await driver.setFrame(null);
      (await driver.findElements('tag name', 'iframe')).should.have.length(3);
    });
  });
});
