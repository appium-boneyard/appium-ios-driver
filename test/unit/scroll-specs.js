/**
 * Created by antonchuev on 9/20/17.
 */

import { IosDriver } from '../../lib/driver';
import chai from 'chai';
import sinon from 'sinon';

chai.expect();
let expect = chai.expect;

describe('scroll inside', () => {
  it('there are no child elements. Expect \'false\' to be returned', async () => {
    let driver = new IosDriver();
    sinon.stub(driver, 'findElementsFromElement').returns([]);
    let success = await driver.scrollInside(0, '0');
    expect(success).to.be.false;
  });
});