import { IosDriver } from '../../lib/driver';
import { uiauto } from '../..';
import chai from 'chai';
import sinon from 'sinon';

chai.should();

const PLUS_HEIGHT = 736;
const NONPLUS_HEIGHT = 568;

describe('device pixel ratio', function () {
  let driver;
  beforeEach(async function () {
    driver = new IosDriver();
  });

  it('pixel ratio should equal 2 with non plus device', async function () {
    sinon.stub(driver, 'getWindowSize').returns({width: 1000, height: NONPLUS_HEIGHT});
    let pixelRatio = await driver.getDevicePixelRatio();
    pixelRatio.should.equal(2);
  });

  it('pixel ratio should equal 3 with plus device', async function () {
    sinon.stub(driver, 'getWindowSize').returns({width: 1000, height: PLUS_HEIGHT});
    let pixelRatio = await driver.getDevicePixelRatio();
    pixelRatio.should.equal(3);
  });
});

describe('status bar height', function () {
  it('should invoke correct command', async function () {
    let driver = new IosDriver();
    driver.uiAutoClient = new uiauto.UIAutoClient();
    sinon.stub(driver.uiAutoClient, 'sendCommand')
      .withArgs('UIATarget.localTarget().frontMostApp().statusBar().rect().size.height;')
      .returns(24);
    await driver.getStatusBarHeight().should.eventually.eql(24);
  });
});

describe('viewport rect', function () {
  it('should return the viewport rect without statusbar height', async function () {
    let driver = new IosDriver();
    sinon.stub(driver, 'getDevicePixelRatio').returns(3.0);
    sinon.stub(driver, 'getStatusBarHeight').returns(24);
    sinon.stub(driver, 'getWindowSize').returns({width: 320, height:568});
    let viewportRect = await driver.getViewportRect();
    viewportRect.left.should.equal(0);
    viewportRect.top.should.equal(24 * 3);
    viewportRect.width.should.equal(320 * 3);
    viewportRect.height.should.equal(568 * 3 - 72);
  });
});
