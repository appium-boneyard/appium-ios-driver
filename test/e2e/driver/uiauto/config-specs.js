// transpile:mocha

import { instrumentsInstanceInit, globalInit, killAll } from './base';
import path from'path';
import { fs } from 'appium-support';


describe('uiauto - config', function () {
  describe('custom socket', function () {
    let altSockDir = '/tmp/abcd';
    let altSock = path.resolve(altSockDir, 'sock');
    let ctx;
    globalInit(this, {chai: true, sock: altSock});
    before(async function () {
      await fs.rimraf(altSockDir);
      ctx = await instrumentsInstanceInit({ sock: altSock });
    });
    after(async () => {
      await killAll(ctx);
    });

    it('should use the alternate sock', function () {
      ctx.proxy.should.exist;
      ctx.proxy.sock.should.equal(altSock);
    });

    it('should work', async () => {
      let res = await ctx.execFunc(
        function () {
          return 'OK Boss';
        }
      );
      res.should.equal('OK Boss');
    });

  });

});
