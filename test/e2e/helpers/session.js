"use strict";
import env from './env';
import B from "bluebird";
import _ from "lodash";
import { IosDriver } from '../../..';
import { ALL_COMMANDS } from 'mobile-json-wire-protocol';
import log from '../../../lib/logger';

class Session {
  constructor (desired={}, opts={}) {
    this.desired = desired;
    this.opts = opts;
    this.initialized = false;
    this.rawDriver = new IosDriver(opts);

    // wrapping the driver so that the call goes
    // through executeCommand
    this.driver = {};
    for (let c of ALL_COMMANDS) {
      this.driver[c] = function (...args) {
        return this.rawDriver.executeCommand(c, ...args);
      }.bind(this);
    }
    for(let c of ['createSession', 'deleteSession']) {
      this.driver[c] = this.rawDriver[c].bind(this.rawDriver);
    }
  }

  async setUp () {
    let caps = _.clone(this.desired);
    _.defaults(caps, env.CAPS);

    log.debug("caps -->", caps);
    log.debug("opts -->", this.opts);

    let init = async (remainingAttempts) => {
      log.debug("remainingAttempts -->", remainingAttempts);
      try {
        await this.driver.createSession(caps);
      } catch (err) {
        log.debug("Init failed with error -->", err);
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
        log.warn("didn't quit cleanly.");
      }
    }
  }

}

export { Session };
