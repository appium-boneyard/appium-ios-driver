import { IosDriver } from '../..';
import sinon from 'sinon';
import path from 'path';
import { tempDir, fs, zip } from 'appium-support';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';


chai.should();
chai.use(chaiAsPromised);

describe('File Movement', function () {
  let driver = new IosDriver();

  describe('pullFolder()', function () {
    it('should pull a folder from filesystem as a base64 zip, extract the zip and have same contents as in filesystem', async function () {
      // Create a temporary directory with one file in it
      const tempPath = await tempDir.openDir();
      await fs.writeFile(path.resolve(tempPath, 'a.txt'), 'Hello World!');

      const getSimPathStub = sinon.stub(driver, 'getSimFileFullPath').returns(tempPath);

      // Zip the directory to base64 and write it to 'zip.zip'
      const zippedData = await driver.pullFolder('/does/not/matter');
      const zippedFilepath = path.resolve(tempPath, 'zip.zip');
      await fs.writeFile(zippedFilepath, zippedData, {encoding: 'base64'});

      // Unzip it and check it matches original file contents
      const unzippedDir = path.resolve(tempPath, 'unzipped');
      await zip.extractAllTo(zippedFilepath, unzippedDir);
      await fs.readFile(path.resolve(unzippedDir, 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World!');

      getSimPathStub.restore();
    });
  });
});
