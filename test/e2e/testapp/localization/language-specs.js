import setup from "../../setup-base";
import desired from '../desired';
import _ from 'lodash';
import env from '../../helpers/env';
import { fs } from  'appium-support';
import path from 'path';

describe('localization - language @skip-ios8 @skip-real-device', function () {
  this.timeout(env.MOCHA_INIT_TIMEOUT);

  after(async () => {
    if (process.env.HOME) {
      // cleaning up dir cause we've messed up with the config
      await fs.rimraf(path.resolve(process.env.HOME, 'Library/Application Support/iPhone Simulator'));
    }
  });

  describe('changing to fr', function () {
    let session = setup(this, _.defaults({
      language: 'fr'}, desired));
    let driver = session.driver;

    it('should be fr', async () => {
      let res = await driver.execute('$.mainApp().preferencesValueForKey("AppleLanguages")[0];');
      res.should.equal('fr');
    });
  });

  describe('changing to de', function () {
    let session = setup(this, _.defaults({
      language: 'de'}, desired));
    let driver = session.driver;

    it('should be de', async () => {
      let res = await driver.execute('$.mainApp().preferencesValueForKey("AppleLanguages")[0];');
      res.should.equal('de');
    });
  });

});
