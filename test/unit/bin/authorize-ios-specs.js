import authorize from '../../../bin/authorize-ios';
import * as teen_process from 'teen_process';
import xcode from 'appium-xcode';
import path from 'path';
import sinon from 'sinon';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';


chai.should();
chai.use(chaiAsPromised);

let sandbox = null;
let SANDBOX = Symbol();
let mocks = {};
let libs = {teen_process, xcode, path};

describe('Authorize test', function () {
  beforeEach(function () {
    sandbox = sinon.createSandbox();
    mocks[SANDBOX] = sandbox;
    for (const [key, value] of _.toPairs(libs)) {
      mocks[key] = sandbox.mock(value);
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should throw an error', async function () {
    mocks.teen_process.expects('exec').once().withExactArgs('DevToolsSecurity', ['--enable']).throws(new Error('Error'));
    await authorize().should.eventually.be.rejectedWith('Error');
    mocks[SANDBOX].verify();
  });

  it('should pass all mocks', async function () {
    mocks.teen_process.expects('exec').atLeast(2);

    mocks.xcode.expects('getPath').once().returns('xcodeDir/Applications/Xcode.app/Contents/Developer');

    await authorize();
    mocks[SANDBOX].verify();
  });
});
