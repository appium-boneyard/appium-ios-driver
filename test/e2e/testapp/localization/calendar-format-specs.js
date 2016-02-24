import setup from "../../setup-base";
import desired from '../desired';
import _ from 'lodash';
import env from '../../helpers/env';
import { fs } from  'appium-support';
import path from 'path';

// TODO: make sure localization is not supposed to work with real device
//       same for other locaization tests
describe('localization - calendarFormat @skip-ios8 @skip-real-device', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  after(async () => {
    if (process.env.HOME) {
      // cleaning up dir cause we've messed up with the config
      await fs.rimraf(path.resolve(process.env.HOME, 'Library/Application Support/iPhone Simulator'));
    }
  });

  describe('changing to gregorian calendar', function () {
    let session = setup(this, _.defaults({
      calendarFormat: 'gregorian'}, desired));
    let driver = session.driver;

    it('should have gregorian calendar format', async () => {
      let res = await driver.execute('$.mainApp().preferencesValueForKey("AppleLocale");');
      res.should.include('@calendar=gregorian');
    });
  });

  describe('changing to buddhist calendar', function () {
    let session = setup(this, _.defaults({
      calendarFormat: 'buddhist'}, desired));
    let driver = session.driver;

    it('should have buddhist calendar format', async () => {
      let res = await driver.execute('$.mainApp().preferencesValueForKey("AppleLocale");');
      res.should.include('@calendar=buddhist');
    });
  });
});
