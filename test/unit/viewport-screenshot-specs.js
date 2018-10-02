import { IosDriver } from '../../lib/driver';
import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import { fs } from 'appium-support';

chai.expect();
let expect = chai.expect;

async function getImage (file) {
  const imagePath = path.resolve(__dirname, '..', '..', '..', 'test', 'unit', 'images', file);
  return await fs.readFile(imagePath, 'utf8');
}

describe('viewport screenshot', function () {
  it('should return non-empty string', async function () {
    let driver = new IosDriver();
    sinon.stub(driver, 'getWindowSize').returns({width: 320, height: 568});
    sinon.stub(driver, 'getDevicePixelRatio').returns(2);
    sinon.stub(driver, 'getStatusBarHeight').returns(0);
    sinon.stub(driver, 'getScreenshot').returns(await getImage('screenshot.b64'));
    let screenshot = await driver.getScreenshot();
    expect(screenshot).to.be.not.empty;
  });
});
