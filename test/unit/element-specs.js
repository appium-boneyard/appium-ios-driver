import { IosDriver } from '../../lib/driver';
import { uiauto } from '../..';
import chai from 'chai';
import sinon from 'sinon';

chai.should();
chai.expect();
let expect = chai.expect;

describe('content size', function () {
  let driver;
  beforeEach(async function () {
    driver = new IosDriver();
    driver.uiAutoClient = new uiauto.UIAutoClient();
  });

  it('should be null for wrong element type', async function () {
    sinon.stub(driver.uiAutoClient, 'sendCommand').returns([]);
    sinon.stub(driver, 'getName').returns('UIAButton');
    let result = await driver.getElementContentSize('0');
    expect(result).to.be.null;
  });

  it('should return correct size for UIATableView', async function () {
    sinon.stub(driver.uiAutoClient, 'sendCommand').returns([{origin:{x: 0, y: 0}, size:{width:320, height:1000}}, {origin:{x: 0, y: 1000}, size:{width:320, height:1000}}]);
    sinon.stub(driver, 'getName').returns('UIATableView');
    sinon.stub(driver, 'getSize').returns({width: 320, height:548});
    sinon.stub(driver, 'getLocationInView').returns({x: 0, y: 20});
    let contentSize = JSON.parse(await driver.getElementContentSize('0'));
    contentSize.left.should.equal(0);
    contentSize.top.should.equal(20);
    contentSize.width.should.equal(320);
    contentSize.height.should.equal(548);
    contentSize.scrollableOffset.should.equal(2000);
  });

  it('should return correct size for UIACollectionView', async function () {
    sinon.stub(driver.uiAutoClient, 'sendCommand').returns([{origin:{x: 0, y: 44}, size:{width:100, height:500}},
      {origin:{x: 110, y: 44}, size:{width:100, height:500}},
      {origin:{x: 220, y: 44}, size:{width:100, height:500}},
      {origin:{x: 0, y: 554}, size:{width:100, height:500}},
      {origin:{x: 110, y: 554}, size:{width:100, height:500}},
      {origin:{x: 220, y: 554}, size:{width:100, height:500}}]);
    sinon.stub(driver, 'getName').returns('UIACollectionView');
    sinon.stub(driver, 'getSize').returns({width: 320, height:524});
    sinon.stub(driver, 'getLocationInView').returns({x: 0, y: 44});
    let contentSize = JSON.parse(await driver.getElementContentSize('0'));
    contentSize.left.should.equal(0);
    contentSize.top.should.equal(44);
    contentSize.width.should.equal(320);
    contentSize.height.should.equal(524);
    contentSize.scrollableOffset.should.equal(1010);
  });
});
