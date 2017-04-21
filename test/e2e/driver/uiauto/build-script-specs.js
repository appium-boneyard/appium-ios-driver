
import buildScript from '../../../../lib/uiauto/build-script';
import chai from 'chai';

chai.should();

describe('uiauto - build-script', function () {
  it('should include all dependencies in a combined script', async function () {
    let path = 'test/assets/testFiles/test1.js';
    let script = await buildScript(path);
    script.should.include("var testFileNum = '1';");
    script.should.include("var testFileNum = '2';");
    script.should.include("var testFileNum = '4';");
  });

  it('should not repeat imports', async function () {
    let path = 'test/assets/testFiles/test3.js';
    await buildScript(path).should.be.rejected;
  });

  it('should take in extra imports', async function () {
    let path = 'test/assets/testFiles/test4.js';
    let script = await buildScript(path, ['./test2.js']);
    script.should.include("var testFileNum = '2';");
    script.should.include("var testFileNum = '4';");
  });
});
