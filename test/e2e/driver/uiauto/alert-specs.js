// transpile:mocha
/* globals $, rootPage, alerts */

import { instrumentsInstanceInit, globalInit, killAll } from './base';

instrumentsInstanceInit;

describe('uiauto - alert', function () {
  let imports = { post: [
    'uiauto/lib/alerts.js',
    'uiauto/lib/status.js',
    'uiauto/lib/element-patch/nil-patch.js',
    'uiauto/lib/element-patch/helper-patch.js',
    'uiauto/lib/mechanic-ext/basics-ext.js',
    'uiauto/lib/mechanic-ext/util-ext.js',
    'uiauto/lib/mechanic-ext/lookup-ext.js',
    'uiauto/lib/mechanic-ext/alert-ext.js',
    'uiauto/lib/mechanic-ext/xpath-ext.js'
  ]};

  globalInit(this, {imports: imports, bootstrap: 'basic'});


  describe('textfields', function () {
    let ctx;

    before(async () => {
      ctx = await instrumentsInstanceInit();
      await ctx.execFunc(
        function () {
          alerts.configure();
        }
      );
    });

    afterEach(async () => {
      await ctx.execFunc(
        function () {
          $('#UICatalog').first().tap();
          $.delay(1000);
        }
      );
      await killAll(ctx);
    });

    it('should retrieve alert text and then accept alert', async () => {
      let res = await ctx.execFunc(
        function () {
          rootPage.clickMenuItem('Alert Views');
          $.delay(2000);
          $('#Okay / Cancel').first().tap();
          $.delay(2000);
          var alertText = $.getAlertText();
          $.acceptAlert();
          return alertText;
        }
      );
      res.should.include('A Short Title Is Best');
      res.should.include('A message should be a short, complete sentence.');
    });
  });
});
