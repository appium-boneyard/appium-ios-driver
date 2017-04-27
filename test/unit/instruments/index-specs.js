// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import chai from 'chai';


chai.should();

describe('index', () => {
  it('exported objects should exist', () => {
    Instruments.should.exist;
    instrumentsUtils.should.exist;
  });
});
