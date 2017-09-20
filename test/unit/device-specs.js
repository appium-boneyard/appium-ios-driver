/**
 * Created by antonchuev on 9/20/17.
 */

import { IosDriver } from '../../lib/driver';
import { uiauto } from '../..';
import chai from 'chai';
import sinon from 'sinon';

chai.should();

describe('device pixel ratio', () => {
  let driver;
  beforeEach(async () => {
    driver = new IosDriver();
  });

  it('pixel ratio should equal 2', async () => {
    sinon.stub(driver, 'getScreenHeight').returns(568);
    let pixelRatio = await driver.getDevicePixelRatio();
    pixelRatio.should.equal(2);
  });

  it('pixel ratio should equal 3', async () => {
    sinon.stub(driver, 'getScreenHeight').returns(736);
    let pixelRatio = await driver.getDevicePixelRatio();
    pixelRatio.should.equal(3);
  });
});

describe('status bar height', () => {
  it('expect invocation of correct command', async () => {
    let driver = new IosDriver();
    driver.uiAutoClient = new uiauto.UIAutoClient();
    driver.uiAutoClient.sendCommand = (cmd) => {
      cmd.should.equal('UIATarget.localTarget().frontMostApp().statusBar().rect().size.height;');
    };

    await driver.getStatusBarHeight();
  });
});

describe('viewport rect', () => {
  it('rect should equal {left: 0, top: 20, width:320, height: 548}', async () => {
    let driver = new IosDriver();
    sinon.stub(driver, 'getStatusBarHeight').returns(20);
    sinon.stub(driver, 'getWindowSize').returns({width: 320, height:568});
    let viewportRect = await driver.getViewportRect();
    viewportRect.left.should.equal(0);
    viewportRect.top.should.equal(20);
    viewportRect.width.should.equal(320);
    viewportRect.height.should.equal(548);
  });
});