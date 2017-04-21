// transpile:mocha
/* globals $ */

import { instrumentsInstanceInit, globalInit, killAll } from './base';
import _ from 'lodash';


describe('uiauto - keyboard', function () {
  let imports = { post: [
    'uiauto/lib/mechanic-ext/gesture-ext.js',
    'uiauto/lib/mechanic-ext/device-ext.js',
    'uiauto/lib/mechanic-ext/keyboard-ext.js',
    'uiauto/lib/element-patch/nil-patch.js'
  ]};
  globalInit(this, {imports: imports, bootstrap: 'basic'});

  describe('hide keyboard', function () {
    /* globals rootPage: true */
    let ctx;
    beforeEach(async () => {
      ctx = await instrumentsInstanceInit();
    });
    afterEach(async () => {
      await killAll(ctx);
    });

    // afterEach(async () => {
    //   await ctx.execFunc(
    //     function () {
    //       $.back();
    //       $.delay(1000);
    //     }
    //   );
    // });

    _.each(['pressKey', 'press'], function (strategy) {
      it(`should hide the keyboard by pressing the done key (${strategy})`, async () => {
        await ctx.execFunc(
          function (strategy) {
            rootPage.clickMenuItem('Text Fields');
            $('textfield').first().tap();
            $('#Done').should.have.length(1);
            $.hideKeyboard(strategy, 'Done');
            $('#Done').should.have.length(0);
          }, [strategy]
        );
      });
    });

    _.each(['tapOutside', 'tapOut'], function (strategy) {
      it(`should hide the keyboard by tapping outside (${strategy})`, async () => {
        await ctx.execFunc(
          function (strategy) {
            rootPage.clickMenuItem('Web View');
            $('textfield').first().tap();
            $('#Go').should.have.length(1);
            $.hideKeyboard(strategy);
            $('#Go').should.have.length(0);
          }, [strategy]
        );
      });
    });

    it('should hide the keyboard with the default strategy', async () => {
      await ctx.execFunc(
        function () {
          rootPage.clickMenuItem('Web View');
          $('textfield').first().tap();
          $('#Go').should.have.length(1);
          $.hideKeyboard('default');
          $('#Go').should.have.length(0);
        }
      );
    });
  });
});
