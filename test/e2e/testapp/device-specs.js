"use strict";

import _ from 'lodash';
import { Session } from '../helpers/session';
import env from '../helpers/env';
import desired from './desired';
import B from 'bluebird';
import '../helpers/setup_testlibs';

describe('testapp - device @skip-real-device', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  describe('invalid deviceName', function () {
    it('should fail gracefully with an invalid deviceName', async () => {
      let session = new Session(_.defaults({deviceName: "iFailure 3.5-inch"},  desired),
        {'no-retry': true});

      await B.resolve(session.setUp())
        .should.be.rejectedWith(/Could not find a device to launch/);
    });
  });
  describe('generic deviceName', function () {
    let session;

    afterEach(async function () {
      await session.tearDown(this.currentTest.state === 'passed');
    });

    it('should work with a generic iPhone deviceName', async () => {
      session = new Session(_.defaults({deviceName: "iPhone Simulator"},  desired),
        {'no-retry': true});
      await session.setUp();
    });

    it('should work with a generic iPad deviceName', async () => {
      session = new Session(_.defaults({deviceName: "iPad Simulator"},  desired),
        {'no-retry': true});
      await session.setUp();
    });

  });

  // TODO: reenable when realdevice logic is in
  describe("real device", function () {
    it("shouldn't try to validate against sims", async () => {
      let session = new Session(
        _.defaults({deviceName: "BadSimulator", udid: "12341234123412341234"},  desired),
        {'no-retry': true}
      );
      await B.resolve(session.setUp())
        .should.be.rejectedWith(/ideviceinstaller/);
    });
  });
});
