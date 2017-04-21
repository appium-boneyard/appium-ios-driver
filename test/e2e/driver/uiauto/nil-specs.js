// transpile:mocha
/* globals $ */

import { instrumentsInstanceInit, globalInit, killAll } from './base';


describe('uiauto - nil', function () {
  let imports = { post: [
    'uiauto/lib/element-patch/nil-patch.js',
    'uiauto/lib/mechanic-ext/basics-ext.js'
  ]};
  globalInit(this, {imports: imports, bootstrap: 'basic'});
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

  it('isNil should return true for not nil elements', async () => {
    let res = await ctx.execFunc(
      function () {
        return $('cell')[0].isNil();
      }
    );
    res.should.be.false;
  });

  it('isNil should return true for nil elements', async () => {
    let res = await ctx.execFunc(
      function () {
        return $('cell')[0].images().isNil();
      }
    );
    res.should.be.true;
  });

  it('isNil should return true for manually created UIAElementNil', async () => {
    let res = await ctx.execFunc(
      function () {
        return $.nil.isNil();
      }
    );
    res.should.be.true;
  });
});
