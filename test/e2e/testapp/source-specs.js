import setup from "../setup-base";
import desired from './desired';
import { DOMParser as XMLDom } from 'xmldom';
import xpath from 'xpath';

describe('testapp - source', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should return page source', async () => {
    let source = await driver.getPageSource();
    let dom = new XMLDom().parseFromString(source);
    let nodes = xpath.select('//AppiumAUT', dom);
    nodes.should.not.be.empty;
  });
});
