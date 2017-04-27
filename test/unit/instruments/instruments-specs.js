// transpile:mocha

import { Instruments, instrumentsUtils } from '../../..';
import * as tp from 'teen_process';
import chai from 'chai';
import xcode from 'appium-xcode';
import { withMocks, verify } from 'appium-test-support';
import { fs } from 'appium-support';
import sinon from 'sinon';
import B from 'bluebird';
import { getXcodeVersion } from './helpers';


chai.should();

describe('instruments', () => {
  function getInstruments (opts = {}) {
    let instruments = new Instruments(opts);
    instruments.xcodeVersion = getXcodeVersion();
    instruments.template = '/a/b/c/d/tracetemplate';
    instruments.instrumentsPath = '/a/b/c/instrumentspath';
    return instruments;
  }
  describe('quickInstrument', withMocks({xcode, instrumentsUtils}, (mocks) => {
    it('should create instruments', async () => {
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
  }));
  describe('constructor', () => {
    it('should create instruments', () => {
      let opts = {
        app: '/a/b/c/my.app',
      };
      let instruments = new Instruments(opts);
      instruments.app.should.equal(opts.app);
    });
  });
  describe('configure', withMocks({xcode, instrumentsUtils}, (mocks) => {
    it('should work', async () => {
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
      verify(mocks);
    });
  }));
  describe('spawnInstruments', withMocks({fs, tp, instrumentsUtils}, (mocks) => {
    it('should work', async () => {
      let instruments = getInstruments();
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once().returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();
      verify(mocks);
    });
    it('should properly handle process arguments', async () => {
      let instruments = getInstruments();
      instruments.processArguments = '-e firstoption firstoptionsarg -e secondoption second option arg';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          sinon.match(instruments.instrumentsPath),
          // sinon.match.string,
          ["-t", "/a/b/c/d/tracetemplate",
           "-D", "/tmp/appium-instruments/instrumentscli0.trace", undefined,
           "-e", "firstoption", "firstoptionsarg",
           "-e", "secondoption", "second option arg",
           "-e", "UIASCRIPT", undefined,
           "-e", "UIARESULTSPATH", "/tmp/appium-instruments"],
          sinon.match.object
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();

      verify(mocks);
    });
    it('should properly handle non-environment-variable process arguments', async () => {
      let instruments = getInstruments();
      instruments.processArguments = 'some random process arguments';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          sinon.match(instruments.instrumentsPath),
          // sinon.match.string,
          ["-t", "/a/b/c/d/tracetemplate",
           "-D", "/tmp/appium-instruments/instrumentscli0.trace", undefined,
           "some random process arguments",
           "-e", "UIASCRIPT", undefined,
           "-e", "UIARESULTSPATH", "/tmp/appium-instruments"],
          sinon.match.object
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();

      verify(mocks);
    });
    it('should properly handle process arguments as hash', async () => {
      let instruments = getInstruments();
      instruments.processArguments = {firstoption: 'firstoptionsarg', secondoption: 'second option arg'};
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          sinon.match(instruments.instrumentsPath),
          // sinon.match.string,
          ["-t", "/a/b/c/d/tracetemplate",
           "-D", "/tmp/appium-instruments/instrumentscli0.trace", undefined,
           "-e", "firstoption", "firstoptionsarg",
           "-e", "secondoption", "second option arg",
           "-e", "UIASCRIPT", undefined,
           "-e", "UIARESULTSPATH", "/tmp/appium-instruments"],
          sinon.match.object
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();

      verify(mocks);
    });
    it('should add language and locale arguments when appropriate', async () => {
      let instruments = getInstruments({locale: "de_DE", language: "de"});
      instruments.processArguments = 'some random process arguments';
      mocks.fs.expects('exists').once().returns(B.resolve(false));
      mocks.tp.expects('spawn').once()
        .withArgs(
          sinon.match(instruments.instrumentsPath),
          // sinon.match.string,
          ["-t", "/a/b/c/d/tracetemplate",
           "-D", "/tmp/appium-instruments/instrumentscli0.trace", undefined,
           "some random process arguments",
           "-e", "UIASCRIPT", undefined,
           "-e", "UIARESULTSPATH", "/tmp/appium-instruments",
           "-AppleLanguages (de)",
           "-NSLanguages (de)",
           "-AppleLocale de_DE"],
          sinon.match.object
        )
        .returns({});
      mocks.instrumentsUtils
        .expects('getIwdPath')
        .once()
        .returns(B.resolve('/a/b/c/iwd'));
      await instruments.spawnInstruments();

      verify(mocks);
    });
  }));
});
