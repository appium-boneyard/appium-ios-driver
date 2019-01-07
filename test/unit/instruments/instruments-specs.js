// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import * as tp from 'teen_process';
import chai from 'chai';
import xcode from 'appium-xcode';
import { withMocks } from 'appium-test-support';
import { fs } from 'appium-support';
import B from 'bluebird';
import { getXcodeVersion } from './helpers';


chai.should();

describe('instruments', withMocks({fs, tp, xcode, instrumentsUtils}, (mocks) => {
  afterEach(function () {
    mocks.verify();
  });

  function getInstruments (opts = {}) {
    let instruments = new Instruments(opts);
    instruments.xcodeVersion = getXcodeVersion();
    instruments.template = '/a/b/c/d/tracetemplate';
    instruments.instrumentsPath = '/a/b/c/instrumentspath';
    return instruments;
  }
  describe('quickInstrument', function () {
    it('should create instruments', async function () {
      mocks.xcode
        .expects('getVersion')
        .once()
        .returns(B.resolve(getXcodeVersion()));
      mocks.xcode
        .expects('getAutomationTraceTemplatePath')
        .once()
        .returns(B.resolve('/a/b/c/d/tracetemplate'));
      mocks.instrumentsUtils
        .expects('getInstrumentsPath')
        .once()
        .returns(B.resolve('/a/b/c/instrumentspath'));
      let opts = {
        app: '/a/b/c/my.app',
      };
      let instruments = await Instruments.quickInstruments(opts);
      instruments.app.should.equal(opts.app);
    });
  });
  describe('constructor', function () {
    it('should create instruments', function () {
      let opts = {
        app: '/a/b/c/my.app',
      };
      let instruments = new Instruments(opts);
      instruments.app.should.equal(opts.app);
    });
  });
  describe('configure', function () {
    it('should work', async function () {
      let instruments = new Instruments({});
      mocks.xcode
        .expects('getVersion')
        .once()
        .returns(B.resolve(getXcodeVersion()));
      mocks.xcode
        .expects('getAutomationTraceTemplatePath')
        .once()
        .returns(B.resolve('/a/b/c/d/tracetemplate'));
      mocks.instrumentsUtils
        .expects('getInstrumentsPath')
        .once()
        .returns(B.resolve('/a/b/c/instrumentspath'));
      await instruments.configure();
      instruments.xcodeVersion.versionString.should.equal(getXcodeVersion().versionString);
      instruments.template.should.equal('/a/b/c/d/tracetemplate');
      instruments.instrumentsPath.should.equal('/a/b/c/instrumentspath');
    });
  });
  describe('spawnInstruments', function () {
    it('should work', async function () {
      let instruments = getInstruments();
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once().returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
    });
    it('should properly handle process arguments', async function () {
      let instruments = getInstruments();
      instruments.processArguments = '-e firstoption firstoptionsarg -e secondoption second option arg';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          instruments.instrumentsPath,
          // sinon.match.string,
          [
            '-t', '/a/b/c/d/tracetemplate',
            '-D', '/tmp/appium-instruments/instrumentscli0.trace', undefined,
            '-e', 'firstoption', 'firstoptionsarg',
            '-e', 'secondoption', 'second option arg',
            '-e', 'UIASCRIPT', undefined,
            '-e', 'UIARESULTSPATH', '/tmp/appium-instruments'
          ],
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
    });
    it('should properly handle non-environment-variable process arguments', async function () {
      let instruments = getInstruments();
      instruments.processArguments = 'some random process arguments';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          instruments.instrumentsPath,
          [
            '-t', '/a/b/c/d/tracetemplate',
            '-D', '/tmp/appium-instruments/instrumentscli0.trace', undefined,
            'some random process arguments',
            '-e', 'UIASCRIPT', undefined,
            '-e', 'UIARESULTSPATH', '/tmp/appium-instruments'
          ],
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
    });
    it('should properly handle process arguments as hash', async function () {
      let instruments = getInstruments();
      instruments.processArguments = {firstoption: 'firstoptionsarg', secondoption: 'second option arg'};
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          instruments.instrumentsPath,
          [
            '-t', '/a/b/c/d/tracetemplate',
            '-D', '/tmp/appium-instruments/instrumentscli0.trace', undefined,
            '-e', 'firstoption', 'firstoptionsarg',
            '-e', 'secondoption', 'second option arg',
            '-e', 'UIASCRIPT', undefined,
            '-e', 'UIARESULTSPATH', '/tmp/appium-instruments'
          ],
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
    });
    it('should add language and locale arguments when appropriate', async function () {
      let instruments = getInstruments({locale: 'de_DE', language: 'de'});
      instruments.processArguments = 'some random process arguments';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          instruments.instrumentsPath,
          [
            '-t', '/a/b/c/d/tracetemplate',
            '-D', '/tmp/appium-instruments/instrumentscli0.trace', undefined,
            'some random process arguments',
            '-e', 'UIASCRIPT', undefined,
            '-e', 'UIARESULTSPATH', '/tmp/appium-instruments',
            '-AppleLanguages (de)',
            '-NSLanguages (de)',
            '-AppleLocale de_DE'
          ],
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
    });
  });
}));
