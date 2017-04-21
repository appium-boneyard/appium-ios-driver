// transpile:mocha
/* globals $ */

import { instrumentsInstanceInit, globalInit, killAll } from './base';
import { getVersion } from 'appium-xcode';


describe('uiauto - grace period', function () {
  let imports = { post: [
    'uiauto/lib/mechanic-ext/gesture-ext.js',
    'uiauto/lib/mechanic-ext/keyboard-ext.js',
  ]};
  globalInit(this, {imports: imports, bootstrap: 'basic'});

  describe('looking for non-existant object', function () {
    let expectedTime = 2000;
    let ctx;
    before(async () => {
      ctx = await instrumentsInstanceInit();

      // xcode 7 is a bit slow.
      let xcodeVersion = await getVersion();
      if (xcodeVersion[0] >= 7) {
        expectedTime = 4000;
      }
    });
    after(async () => {
      await killAll(ctx);
    });

    it('should be quick when grace period is not set', async () => {
      let refMs = Date.now();
      let res = await ctx.execFunc(
        function () {
          return $('#not exist');
        }
      );
      (Date.now() - refMs).should.be.below(expectedTime);
      res.should.have.length(0);
    });

    it('should be quick when pushing and popping 0 timeout', async () => {
      let refMs = Date.now();
      let res = await ctx.execFunc(
        function () {
          $.target().pushTimeout(0);
          var res = $('#not exist');
          $.target().popTimeout();
          return res;
        }
      );
      res.should.have.length(0);
      (Date.now() - refMs).should.be.below(expectedTime);
    });

    // Skipping because of bug, it takes more than 25 second!
    it.skip('should be quick when grace period is set to 1', async () => {
      let refMs = Date.now();
      let res = await ctx.execFunc(
        function () {
          $.target().setTimeout(1);
          $.warn('lookup starting');
          var res = $('#not exist');
          $.warn('lookup finished');
          return res;
        }
      );
      res.should.have.length(0)
      (Date.now() - refMs).should.be.below(5000);
    });
  });
});
