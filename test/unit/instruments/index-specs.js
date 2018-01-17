// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import chai from 'chai';


chai.should();

describe('index', function () {
  it('exported objects should exist', function () {
    Instruments.should.exist;
    instrumentsUtils.should.exist;
  });
});
