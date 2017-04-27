// transpile:mocha

import { instrumentsUtils, Instruments } from '../../..';
import * as tp from 'teen_process';
import xcode from 'appium-xcode';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { withMocks, verify, stubEnv } from 'appium-test-support';
import { fs } from 'appium-support';
import B from 'bluebird';


chai.should();
chai.use(chaiAsPromised);

describe('utils', () => {
  describe('getInstrumentsPath', withMocks({tp}, (mocks) => {
    it('should retrieve path', async () => {
      mocks.tp
        .expects('exec')
        .once()
        .returns(B.resolve({stdout: '/a/b/c/d\n', stderr:'' }));
      (await instrumentsUtils.getInstrumentsPath()).should.equal('/a/b/c/d');
      verify(mocks);
    });
    it('should throw an error if cannnot find Instruments', async () => {
      mocks.tp
        .expects('exec')
        .once()
        .throws(new Error('Instruments not found'));
      await instrumentsUtils.getInstrumentsPath().should.be.rejectedWith(/Could not find the instruments binary/);
      verify(mocks);
    });
  }));
  describe('getAvailableDevices', withMocks({tp}, (mocks) => {
    const xcodeVersions = {
      '8.1(8B62)': {
        instrumentsOutput:
`Known Devices:
galaxy [D633B2E7-6A48-5B2C-B9E4-A1525D3F1155]
Angel (10.1.1) [xxxx]
Apple TV 1080p (10.0) [70D6BCBA-FCAD-4BBA-ADE9-B71757F4261F] (Simulator)
Apple Watch - 42mm (3.1) [C0E1D6CC-F1C8-4223-AC71-BB8A5182A1A8] (Simulator)
iPad 2 (9.3) [74266576-7E47-4BCB-B0D9-B11133B06A77] (Simulator)
iPad Air (10.1) [8B3934DB-350A-44A0-A8E2-1BC83E346309] (Simulator)
iPad Air 2 (10.1) [D9C1D938-D06D-4CDA-AB59-E16DC30ABD03] (Simulator)
iPad Pro (12.9 inch) (10.1) [9E0F7B13-1BCE-4E7C-9A89-8B19F9B99223] (Simulator)
iPad Pro (9.3) [B02F8899-AF72-40EA-B925-149B22BB72B2] (Simulator)
iPad Pro (9.7 inch) (10.1) [D4E6E5BC-F17F-4088-8FD4-58F07ECC6349] (Simulator)
iPad Retina (10.1) [2B6F522D-B7EA-4F74-811A-DB70B4E7CC7C] (Simulator)
iPad Retina (9.3) [EEAB60FD-3F39-43FE-B8DF-C1097CB22066] (Simulator)
iPhone 4s (9.3) [D61E60EE-25A8-49FA-ADEF-C05F7B737D1E] (Simulator)
iPhone 5 (10.1) [271D45F7-34F5-4F76-8E40-951842CF8F51] (Simulator)
iPhone 5 (9.3) [BF101A98-9FCF-4A4A-8484-F7FF1D575170] (Simulator)
iPhone 5s (10.1) [36F901CC-C539-442E-AEA6-CE87346CA8D7] (Simulator)
iPhone 5s (9.3) [D5C1064D-9543-4484-994E-4D1191587D3E] (Simulator)
iPhone 6 (10.1) [A9672FEC-2E64-4717-8DA1-3538751CCA8A] (Simulator)
iPhone 6 (9.3) [A65D1276-D09E-416A-9B55-C1FF91BE66B5] (Simulator)
iPhone 6 Plus (10.1) [58F617A9-C5F3-4AD0-A35C-F413F757645D] (Simulator)
iPhone 6 Plus (9.3) [805C5E84-CFF6-4E8B-A396-5A5EFBE93551] (Simulator)
iPhone 6s (10.1) [B760E290-B16D-44B9-ACBA-B3088E3FDE7A] (Simulator)
iPhone 6s (9.3) [FC002921-2164-4CEC-B131-CAC308EDD66A] (Simulator)
iPhone 6s Plus (10.1) [8D28052A-4694-4F3A-A988-37D2CC1EDBFC] (Simulator)
iPhone 6s Plus (9.3) [528BA7BD-887B-48EF-92AB-C1E1867C6970] (Simulator)
iPhone 7 (10.1) [F127C749-B3C8-467C-A6A2-1C556F66B1E9] (Simulator)
iPhone 7 (10.1) + Apple Watch Series 2 - 38mm (3.1) [FDBC436C-88D5-4B5D-ABD6-857D5B26C895] (Simulator)
iPhone 7 Plus (10.1) [70AE2D72-BF88-4033-B21E-838185E0EC3E] (Simulator)
iPhone 7 Plus (10.1) + Apple Watch Series 2 - 42mm (3.1) [368E0E6A-DBB0-4272-B242-B8031739E9A8] (Simulator)
iPhone SE (10.1) [1711A8A4-8733-4B37-BBCB-777F6A5B544B] (Simulator)`,
        devices: [
          'Angel (10.1.1) [xxxx]',
          'Apple TV 1080p (10.0) [70D6BCBA-FCAD-4BBA-ADE9-B71757F4261F] (Simulator)',
          'Apple Watch - 42mm (3.1) [C0E1D6CC-F1C8-4223-AC71-BB8A5182A1A8] (Simulator)',
          'iPad 2 (9.3) [74266576-7E47-4BCB-B0D9-B11133B06A77] (Simulator)',
          'iPad Air (10.1) [8B3934DB-350A-44A0-A8E2-1BC83E346309] (Simulator)',
          'iPad Air 2 (10.1) [D9C1D938-D06D-4CDA-AB59-E16DC30ABD03] (Simulator)',
          'iPad Pro (12.9 inch) (10.1) [9E0F7B13-1BCE-4E7C-9A89-8B19F9B99223] (Simulator)',
          'iPad Pro (9.3) [B02F8899-AF72-40EA-B925-149B22BB72B2] (Simulator)',
          'iPad Pro (9.7 inch) (10.1) [D4E6E5BC-F17F-4088-8FD4-58F07ECC6349] (Simulator)',
          'iPad Retina (10.1) [2B6F522D-B7EA-4F74-811A-DB70B4E7CC7C] (Simulator)',
          'iPad Retina (9.3) [EEAB60FD-3F39-43FE-B8DF-C1097CB22066] (Simulator)',
          'iPhone 4s (9.3) [D61E60EE-25A8-49FA-ADEF-C05F7B737D1E] (Simulator)',
          'iPhone 5 (10.1) [271D45F7-34F5-4F76-8E40-951842CF8F51] (Simulator)',
          'iPhone 5 (9.3) [BF101A98-9FCF-4A4A-8484-F7FF1D575170] (Simulator)',
          'iPhone 5s (10.1) [36F901CC-C539-442E-AEA6-CE87346CA8D7] (Simulator)',
          'iPhone 5s (9.3) [D5C1064D-9543-4484-994E-4D1191587D3E] (Simulator)',
          'iPhone 6 (10.1) [A9672FEC-2E64-4717-8DA1-3538751CCA8A] (Simulator)',
          'iPhone 6 (9.3) [A65D1276-D09E-416A-9B55-C1FF91BE66B5] (Simulator)',
          'iPhone 6 Plus (10.1) [58F617A9-C5F3-4AD0-A35C-F413F757645D] (Simulator)',
          'iPhone 6 Plus (9.3) [805C5E84-CFF6-4E8B-A396-5A5EFBE93551] (Simulator)',
          'iPhone 6s (10.1) [B760E290-B16D-44B9-ACBA-B3088E3FDE7A] (Simulator)',
          'iPhone 6s (9.3) [FC002921-2164-4CEC-B131-CAC308EDD66A] (Simulator)',
          'iPhone 6s Plus (10.1) [8D28052A-4694-4F3A-A988-37D2CC1EDBFC] (Simulator)',
          'iPhone 6s Plus (9.3) [528BA7BD-887B-48EF-92AB-C1E1867C6970] (Simulator)',
          'iPhone 7 (10.1) [F127C749-B3C8-467C-A6A2-1C556F66B1E9] (Simulator)',
          'iPhone 7 (10.1) + Apple Watch Series 2 - 38mm (3.1) [FDBC436C-88D5-4B5D-ABD6-857D5B26C895] (Simulator)',
          'iPhone 7 Plus (10.1) [70AE2D72-BF88-4033-B21E-838185E0EC3E] (Simulator)',
          'iPhone 7 Plus (10.1) + Apple Watch Series 2 - 42mm (3.1) [368E0E6A-DBB0-4272-B242-B8031739E9A8] (Simulator)',
          'iPhone SE (10.1) [1711A8A4-8733-4B37-BBCB-777F6A5B544B] (Simulator)'
        ]
      },
      '7.3': {
        instrumentsOutput:
`Known Devices:
INsaikrisv [C8476FF9-9BC4-5E52-AE3D-536A2E85D43B]
AppiumParallel1 (9.2) [0120C306-95C1-4196-BC13-4196105EBEF9]
Apple TV 1080p (9.1) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]
iPad 2 (8.4) [B45264A0-551C-41A5-A636-8211C05D8003] (Simulator)
iPad 2 (9.2) [4444EB1E-BA48-4DFA-B16C-777171FCF3BC] (Simulator)
iPad Air (8.4) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF] (Simulator)`,
        devices: [
          'AppiumParallel1 (9.2) [0120C306-95C1-4196-BC13-4196105EBEF9]',
          'Apple TV 1080p (9.1) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]',
          'iPad 2 (8.4) [B45264A0-551C-41A5-A636-8211C05D8003] (Simulator)',
          'iPad 2 (9.2) [4444EB1E-BA48-4DFA-B16C-777171FCF3BC] (Simulator)',
          'iPad Air (8.4) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF] (Simulator)'
        ]
      },
      '7.0-7.2': {
        instrumentsOutput:
`Known Devices:
INsaikrisv [C8476FF9-9BC4-5E52-AE3D-536A2E85D43B]
AppiumParallel1 (9.2) [0120C306-95C1-4196-BC13-4196105EBEF9]
Apple TV 1080p (9.1) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]
iPad 2 (8.4) [B45264A0-551C-41A5-A636-8211C05D8003]
iPad 2 (9.2) [4444EB1E-BA48-4DFA-B16C-777171FCF3BC]
iPad Air (8.4) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF]`,
        devices: [
          'AppiumParallel1 (9.2) [0120C306-95C1-4196-BC13-4196105EBEF9]',
          'Apple TV 1080p (9.1) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]',
          'iPad 2 (8.4) [B45264A0-551C-41A5-A636-8211C05D8003]',
          'iPad 2 (9.2) [4444EB1E-BA48-4DFA-B16C-777171FCF3BC]',
          'iPad Air (8.4) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF]'
        ]
      },
      '6.0-6.4': {
        instrumentsOutput:
`Known Devices:
INsaikrisv [C8476FF9-9BC4-5E52-AE3D-536A2E85D43B]
AppiumParallel1 (8.4 Simulator) [0120C306-95C1-4196-BC13-4196105EBEF9]
Apple TV 1080p (8.4 Simulator) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]
iPad 2 (8.4 Simulator) [B45264A0-551C-41A5-A636-8211C05D8003]
iPad Air (8.2 Simulator) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF]`,
        devices: [
          'AppiumParallel1 (8.4 Simulator) [0120C306-95C1-4196-BC13-4196105EBEF9]',
          'Apple TV 1080p (8.4 Simulator) [C5957108-6BA4-4A98-9A83-4BED47EFF1BC]',
          'iPad 2 (8.4 Simulator) [B45264A0-551C-41A5-A636-8211C05D8003]',
          'iPad Air (8.2 Simulator) [F26279E7-8BAF-4D7B-ABFE-08D1AC364DCF]'
        ]
      }
    };

    Object.keys(xcodeVersions).forEach((version) =>
      it(`should work for Xcode ${version}`, async () => {
        mocks.tp
          .expects('exec')
          .once()
          .returns(B.resolve({stdout: '/a/b/c/d\n', stderr:'' }));
        mocks.tp
          .expects('exec')
          .once()
          .returns(B.resolve({stdout: xcodeVersions[version].instrumentsOutput, stderr:'' }));
        (await instrumentsUtils.getAvailableDevices()).should.deep.equal(xcodeVersions[version].devices);
        verify(mocks);
      })
    );

    it('should throw an error when Instruments fails', async () => {
      mocks.tp
        .expects('exec')
        .once()
        .returns(B.resolve({stdout: '/a/b/c/d\n', stderr:'' }));
      mocks.tp
        .expects('exec')
        .once()
        .throws(new Error('Instruments failed'));
      await instrumentsUtils.getAvailableDevices().should.be.rejectedWith(/Failed getting devices, err: Error: Instruments failed./);
      verify(mocks);
    });
  }));
  describe('killAllInstruments', withMocks({tp}, (mocks) => {
    it('should work', async () => {
      mocks.tp
        .expects('exec')
        .once()
        .returns(B.resolve({stdout: '', stderr:'' }));
      await instrumentsUtils.killAllInstruments();
      verify(mocks);
    });
  }));
  describe('cleanAllTraces', withMocks({fs}, (mocks) => {
    stubEnv();
    it('should work', async () => {
      process.env.CLEAN_TRACES = 1;
      mocks.fs
        .expects('rimraf')
        .once()
        .returns(B.resolve({stdout: '', stderr:'' }));
      await instrumentsUtils.cleanAllTraces();
      verify(mocks);
    });
  }));
  describe('parseLaunchTimeout', () => {
    stubEnv();
    it('should work', () => {
      instrumentsUtils.parseLaunchTimeout(90000).should.deep.equal({
        global: 90000 });
      instrumentsUtils.parseLaunchTimeout('90000').should.deep.equal({
        global: 90000 });
      instrumentsUtils.parseLaunchTimeout({global: 90000, afterLaunch: 30000}).should.deep.equal({
        global: 90000, afterLaunch: 30000 });
      instrumentsUtils.parseLaunchTimeout('{"global": 90000, "afterLaunch": 30000}').should.deep.equal({
        global: 90000, afterLaunch: 30000 });
    });
    it('should work with invalid JSON', () => {
      instrumentsUtils.parseLaunchTimeout('x').should.equal('x');
    });
  });
  describe('getIwdPath', withMocks({fs}, (mocks) => {
    it('should work when path is found', async () => {
      mocks.fs
        .expects('exists')
        .once()
        .returns(B.resolve(true));
      (await instrumentsUtils.getIwdPath('10')).should.match(
        /.*instruments-iwd\/iwd10/);
      verify(mocks);
    });
    it('should work when path is not found', async () => {
      mocks.fs
        .expects('exists')
        .once()
        .returns(B.resolve(false));
      (await instrumentsUtils.getIwdPath('10')).should.match(
        /.*instruments-iwd\/iwd/);
      verify(mocks);
    });
  }));

  describe('quickLaunch', withMocks({fs, tp, xcode, instrumentsUtils}, (mocks) => {
    it('should remove trace directory', async () => {
      mocks.xcode
        .expects('getAutomationTraceTemplatePath')
        .once()
        .returns(B.resolve('/a/b/c/d/tracetemplate'));
      mocks.fs
        .expects('rimraf')
        .once()
        .returns(B.resolve());
      mocks.tp
        .expects('exec')
        .once()
        .withArgs('xcrun')
        .returns(B.resolve({stdout: '', stderr:'' }));
      await instrumentsUtils.quickLaunch();
      verify(mocks);
    });
  }));

  describe('quickInstruments', withMocks({xcode}, (mocks) => {
    it('should create an Instruments object', async () => {
      let inst = await instrumentsUtils.quickInstruments({
        xcodeTraceTemplatePath: '/some/path'
      });
      inst.should.be.an.instanceof(Instruments);
    });

    it('should get xcode trace template if none supplied', async () => {
      mocks.xcode
        .expects('getAutomationTraceTemplatePath')
        .once()
        .returns(B.resolve('/some/path'));
      let inst = await instrumentsUtils.quickInstruments();
      inst.template.should.equal('/some/path');
    });
  }));
});
