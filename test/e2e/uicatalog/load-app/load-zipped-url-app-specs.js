import setup from "../../setup-base";
import desired from '../desired';
import _ from 'lodash';

// TODO: skipping on real device because we would need a signed app
describe('uicatalog - load zipped app via url @skip-real-device', function () {

  let appUrl = 'https://appium.s3.amazonaws.com/TestApp7.1.app.zip';

  let session = setup(this, _.defaults({'app': appUrl}, desired));
  let driver = session.driver;

  it('should load a zipped app via url', async () => {
    let el = await driver.findElement('class name', 'UIATextField');
    el.should.exist;
  });
});
