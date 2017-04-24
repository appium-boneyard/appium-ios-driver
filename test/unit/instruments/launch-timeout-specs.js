// transpile:mocha

import { Instruments } from '../../..';
import chai from 'chai';


let should = chai.should();

describe('launch-timeout', () => {
  it('should work when passing timeout as an integer', () => {
    let instruments = new Instruments({launchTimeout: 123456});
    instruments.launchTimeout.global.should.equal(123456);
    should.not.exist(instruments.launchTimeout.afterSimLaunch);
  });

  it('should work when passing timeout as an integer string', () => {
    let instruments = new Instruments({launchTimeout: '123456'});
    instruments.launchTimeout.global.should.equal(123456);
    should.not.exist(instruments.launchTimeout.afterSimLaunch);
  });

  it('should work when passing timeout as an object', () => {
    let instruments = new Instruments({launchTimeout: {global: 123456, afterSimLaunch: 234}});
    instruments.launchTimeout.global.should.equal(123456);
    instruments.launchTimeout.afterSimLaunch.should.equal(234);
  });

  it('should work when passing timeout as a JSON object', () => {
    let instruments = new Instruments({launchTimeout: '{"global": 123456, "afterSimLaunch": 234}'});
    instruments.launchTimeout.global.should.equal(123456);
    instruments.launchTimeout.afterSimLaunch.should.equal(234);
  });
});
