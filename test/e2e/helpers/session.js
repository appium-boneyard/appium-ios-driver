"use strict";
import env from './env';
import B from "bluebird";
import _ from "lodash";
import { IosDriver } from '../../..';
import { ALL_COMMANDS } from 'mobile-json-wire-protocol';

class Session {
  constructor (desired={}, opts={}) {
    this.desired = desired;
    this.opts = opts;
    this.initialized = false;
    this.rawDriver = new IosDriver();

    // wrapping the driver so that the call goes
    // through executeCommand
    this.driver = {};
    for (let c of ALL_COMMANDS) {
      this.driver[c] = (...args) => {
        return this.rawDriver.executeCommand(c,...args);
      };
    }
    for(let c of ['createSession', 'deleteSession']) {
      this.driver[c] = this.rawDriver[c].bind(this.rawDriver);
    }
  }

  async setUp () {
    let caps = _.clone(this.desired);
    _.defaults(caps, env.CAPS);

    if (env.VERBOSE) console.log("caps -->", this.caps);
    if (env.VERBOSE) console.log("opts -->", this.opts);

    let init = async (remainingAttempts) => {
      if (env.VERBOSE) console.log("remainingAttempts -->", remainingAttempts);
      try {
        await this.driver.createSession(caps);
      } catch (err) {
        if (env.VERBOSE) console.log("Init failed with error -->", err);
        remainingAttempts --;
        if (remainingAttempts === 0) {
          throw err;
        } else {
          await this.driver.deleteSession();
          await B.delay(10000);
          await init(remainingAttempts);
        }
      }
    };

    let attempts = this.opts['no-retry'] ? 1 : 3;
    if (env.MAX_RETRY) attempts = Math.min(env.MAX_RETRY, attempts);
    await init(attempts);
    this.initialized = true;
    this.driver.implicitWait(env.IMPLICIT_WAIT_TIMEOUT);
  }

  async tearDown () {
    if (this.initialized) {
      try {
        await this.driver.deleteSession();
      } catch (err) {
        if (env.VERBOSE) console.warn("didn't quit cleanly.");
      }
    }
  }

}

export { Session };

  //wd.addPromiseChainMethod('printSource', function () {
    //return this.source().then(function (s) { console.log(s); });
  //});

  //wd.addPromiseChainMethod('firstWebContext', function (assertCtxLength) {
    //let d = this;
    //return d
      //.contexts()
      //.then(function (ctxs) {
        //if (!_.isUndefined(assertCtxLength) && ctxs.length !== assertCtxLength) {
          //throw new Error("Expected " + assertCtxLength + " contexts but got " +
                          //ctxs.length);
        //}
        //let context = null;
        //for (let i = 0; i < ctxs.length; i++) {
          //if (ctxs[i].indexOf('NATIVE') === -1) {
            //context = ctxs[i];
          //}
        //}
        //if (context === null) {
          //throw new Error("Could not find any web contexts. Contexts were: " +
                          //JSON.stringify(ctxs));
        //}
        //return d.context(context);
      //});
  //});

//module.exports.attachToSession = function (sessionId) {
  //let browser = wd.promiseChainRemote(env.APPIUM_HOST, env.APPIUM_PORT, env.APPIUM_USERNAME, env.APPIUM_PASSWORD);
  //browser.attach(sessionId);
  //return browser;
//};
