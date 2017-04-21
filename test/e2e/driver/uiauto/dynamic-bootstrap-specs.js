// transpile:mocha

import { uiauto } from '../../../..';
import log from '../../../../lib/uiauto/logger';
import chai from 'chai';
import { fs } from 'appium-support';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import path from 'path';


chai.should();
chai.use(sinonChai);

describe('uiauto - dynamic bootstrap', function () {
  function envFromCode(code) {
    // let's pick out the dynamic env from the new bootsrap file with this
    // regex so we can be sure it matches what we expect
    var envRe = /^bootstrap\((\{[^]+})\);$/m;
    var envStr = envRe.exec(code)[1];
    var env = JSON.parse(envStr);
    return env;
  }

  async function checkCode (code) {
    var env = envFromCode(code);
    env.nodePath.should.equal(process.execPath);
    env.commandProxyClientPath.should.exist;
    env.instrumentsSock.should.exist;
    (await fs.exists(env.commandProxyClientPath)).should.be.true;
    return env;
  }

  before(function () {
    sinon.spy(log, 'debug');
  });

  after(function () {
    log.debug.restore();
  });

  it('should generate dynamic bootstrap', async () => {
    process.env.APPIUM_BOOTSTRAP_DIR = path.resolve('/', 'tmp', 'appium-uiauto', 'test', 'unit', 'bootstrap');
    if (await fs.exists(process.env.APPIUM_BOOTSTRAP_DIR)) {
      await fs.rimraf(process.env.APPIUM_BOOTSTRAP_DIR);
    }

      // first call: should create new bootstrap file
    let bootstrapFile = await uiauto.prepareBootstrap();
    bootstrapFile.should.match(/\/tmp\/appium-uiauto\/test\/unit\/bootstrap\/bootstrap\-.*\.js/);
    let code = await fs.readFile(bootstrapFile, 'utf8');
    await checkCode(code);
    log.debug.calledWithMatch(/Creating or overwriting dynamic bootstrap/).should.be.true;
    log.debug.reset();

    // second call: should reuse bootstrap file
    bootstrapFile = await uiauto.prepareBootstrap();
    bootstrapFile.should.match(/\/tmp\/appium-uiauto\/test\/unit\/bootstrap\/bootstrap\-.*\.js/);
    code = await fs.readFile(bootstrapFile, 'utf8');
    await checkCode(code);
    log.debug.calledWithMatch(/Reusing dynamic bootstrap/).should.be.true;
    log.debug.reset();

    // third call using custom socket path: should create different bootstrap file
    bootstrapFile = await uiauto.prepareBootstrap({sock: '/tmp/abcd/sock'});
    bootstrapFile.should.match(/\/tmp\/appium-uiauto\/test\/unit\/bootstrap\/bootstrap\-.*\.js/);
    code = await fs.readFile(bootstrapFile, 'utf8');
    let env = await checkCode(code, {isVerbose: true, gracePeriod: 5});
    env.instrumentsSock.should.equal('/tmp/abcd/sock');
    log.debug.calledWithMatch(/Creating or overwriting dynamic bootstrap/).should.be.ok;
    log.debug.reset();
  });
});
