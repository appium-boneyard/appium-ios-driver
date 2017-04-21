// transpile:mocha
/* globals $ */

import { instrumentsInstanceInit, globalInit, killAll } from './base';
import { getVersion } from 'appium-xcode';
import _ from 'lodash';
import B from 'bluebird';


describe('uiauto - commands', function () {
  globalInit(this, {bootstrap: 'basic'});
  let numCommands = 100;
  before(async () => {
    // xcode 7 is a bit slow.
    let xcodeVersion = await getVersion();
    if (xcodeVersion[0] >= 7) {
      numCommands = 50;
    }
  });

  describe('simple sequences', function () {
    let ctx;
    before(async () => {
      ctx = await instrumentsInstanceInit();
    });
    after(async () => {
      await killAll(ctx);
    });

    it('should send one valid command returning a value', async () => {
      (await ctx.sendCommand("'123'")).should.equal('123');
    });

    it('should send one valid command returning empty value', async () => {
      (await ctx.sendCommand("$.warn('starting')")).should.equal('');
    });

    it('should respond to invalid command and not die', async () => {
      await ctx.sendCommand('i_am_invalid()').should.be.rejectedWith(/Can't find variable: i_am_invalid/);
      await ctx.sendCommand("$.warn('still alive')");
    });

    it('should repond to 10 commands in a row', async () => {
      let seq = [];
      _.times(10, function (i) {
        seq.push(async () => {
          (await ctx.sendCommand(`(function () { return ${i}})()`)).should.equal(i);
        });
      });
      await B.reduce(seq, async (res, task) => {
        await res;
        return task();
      }, null);
    });

  });

  describe(`sending ${numCommands} valid commands`, () => {
    let ctx;
    before(async () => {
      ctx = await instrumentsInstanceInit();
    });
    after(async () => {
      await killAll(ctx);
    });

    it('should work', async () => {
      let seq = [];
      _.times(numCommands, (i) => {
        seq.push(async () => {
          (await ctx.sendCommand(`(function () { return "${i}"})()`)).should.equal(i.toString());
          // if ((i+1)%10 === 0) console.log('sent:', (i+1));
        });
      });
      await B.reduce(seq, async (res, task) => {
        await res;
        return task();
      }, null);
    });
  });

  describe(`sending ${numCommands} alternating valid and invalid`, () => {
    let ctx;
    before(async () => {
      ctx = await instrumentsInstanceInit();
    });
    after(async () => {
      await killAll(ctx);
    });

    it('should work', async () => {
      let seq = [];
      _.times(numCommands, (i) => {
        if (i%2 === 0)
          seq.push(async () => {
            (await ctx.sendCommand(`(function () { return "${i}"})()`)).should.equal(i.toString());
            // if ((i+1)%10 === 0) console.log('sent:', (i+1));
          });
        else
          seq.push(async () => {
            await ctx.sendCommand('(ffffunction () { return "' + i + '"})()')
              .should.be.rejectedWith(/Unexpected token/);
            // if ((i+1)%10 === 0) console.log('sent:', (i+1));
          });
      });
      await B.reduce(seq, async (res, task) => {
        await res;
        return task();
      }, null);
    });

  });

  describe('command with big result', () => {
    let ctx;
    before(async () => {
      ctx = await instrumentsInstanceInit();
    });
    after(async () => {
      await killAll(ctx);
    });

    // UIAuto code
    let configureUIAuto = () => {
      $.extend($, {
        oneMamaLongString: function (n, mapping) {
          var i;
          if (!mapping) {
            mapping = [];
            for (i=0; i<n; i++){
              mapping.push(i);
            }
          }
          var main = "";
          for (i = 0; i < n; i++) {
            main += mapping[i % 10];
          }
          return main;
        },

        oneMamaHugeTree: function (n, d) {
          function addChildren(root, depth) {
            if (depth === d) return;
            root.children = {};
            var i;
            for (i=0; i<n; i++){
              root.children['c' + i] = { name: 'child ' + i };
              addChildren(root.children['c' + i], depth +1);
            }
          }
          var root = {name: 'root'};
          addChildren(root, 0);
          return root;
        },

      });
    };

    before(async () => {
      await ctx.execFunc(configureUIAuto);
    });

    let testN = async (n) => {
      let s = await ctx.sendCommand(`$.oneMamaLongString(${n})`);
      s.should.have.length(n);
      _.times(n, function (i) {
        parseInt(s[i] , 10).should.equal(i%10);
      });
    };

    it('should work a small string', () => {
      return testN(1000);
    });

    it('should work a medium string', function () {
      return testN(100000);
    });

    it('should work a big string', function () {
      return testN(1000000);
    });

    let testNWithSpaces = async (n) => {
      let s = await ctx.sendCommand(`$.oneMamaLongString(${n}, [0,1,2,3,4,' ',6,7,8,9])`);
      s.should.have.length(n);
      _.times(n, function (i) {
        if (i%10 === 5){
          s[i].should.equal(' ');
        } else {
          parseInt(s[i] , 10).should.equal(i%10);
        }
      });
    };

    it('should work with a big string with spaces', function () {
      return testNWithSpaces(200000);
    });

    let getHugeTree = async (n, d) => {
      return ctx.sendCommand(`$.oneMamaHugeTree(${n}, ${d})`);
    };

    it('should work with a medium tree', async () => {
      let res = await getHugeTree(5, 3);
      res.name.should.equal('root');
      res.children.c1.children.c2.children
        .c3.name.should.equal('child 3');
      JSON.stringify(res).length.should.be.above(4000);
    });

    it('should work with a huge tree', async () => {
      let res = await getHugeTree(5, 7);
      res.name.should.equal('root');
      res.children.c1.children.c2.children
        .c3.children.c2.name.should.equal('child 2');
      JSON.stringify(res).length.should.be.above(2000000);
    });
  });

});
