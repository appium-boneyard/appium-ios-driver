import setup from "../../setup-base";
import desired from '../desired';
import _ from 'lodash';
import env from '../../helpers/env';
import { fs } from  'appium-support';
import path from 'path';

describe('localization - locale @skip-real-device', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  after(async () => {
    if (process.env.HOME) {
      // cleaning up dir cause we've messed up with the config
      await fs.rimraf(path.resolve(process.env.HOME, 'Library/Application Support/iPhone Simulator'));
    }
  });
  describe('default locale', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    it('should be english @skip-ios8', async () => {
      // ios8 doesn't do default locale; it will be whatever was last in
      // the sim
      let res = driver.execute('$.mainApp().preferencesValueForKey("AppleLocale");');
      res.should.become('en_US');
    });
  });

  describe('changing locale @skip-real-device', function () {
    let session = setup(this, _.defaults({
      locale: 'fr'}, desired));
    let driver = session.driver;

    it('should be fr', async () => {
      let res = driver.execute('$.mainApp().preferencesValueForKey("AppleLocale");');
      res.should.become('fr');
    });
  });

  describe('changing back @skip-real-device', function () {
    let session = setup(this, _.defaults({
      locale: 'en_US'}, desired));
    let driver = session.driver;

    it('should be en', async () => {
      let res = driver.execute('$.mainApp().preferencesValueForKey("AppleLocale");');
      res.should.become('en_US');
    });
  });

});
