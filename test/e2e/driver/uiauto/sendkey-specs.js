// transpile:mocha
/* globals $, env */

import { instrumentsInstanceInit, globalInit, killAll } from './base';
import _ from 'lodash';

describe('uiauto - sendKey', function () {
  let imports = { post: [
     'uiauto/lib/mechanic-ext/keyboard-ext.js',
    'uiauto/lib/element-patch/helper-patch.js'
  ]};
  globalInit(this, {imports: imports, bootstrap: 'basic'});

  /* globals rootPage: true */
  let ctx;
  before(async function () {
    ctx = await instrumentsInstanceInit();
  });
  after(async () => {
    await killAll(ctx);
  });

  afterEach(async () => {
    await ctx.execFunc(
      function () {
        $('#UICatalog').first().tap();
        $.delay(1000);
      }
    );
  });

  let keyStrategies = [undefined, 'oneByOne', 'grouped', 'setValue'];
  _.each(keyStrategies, function (sendKeyStrategy) {
    it(`should work with strategy: ${sendKeyStrategy}`, async () => {
      await ctx.execFunc(
        function (sendKeyStrategy) {
          env.sendKeyStrategy = sendKeyStrategy;
          $.delay(1000);
          rootPage.clickMenuItem('Text Fields');
          $.delay(1000);
          var textfield = $('textfield').first()[0];
          textfield.setValue('');
          $.delay(3000);
          $('textfield').first()[0].setValueByType('Hello World');
          $.delay(3000);
        }, [sendKeyStrategy]
      );
    });
  });
});
