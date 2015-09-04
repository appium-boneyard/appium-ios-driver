import setup from "../../setup-base";
import desired from '../desired';
import _ from 'lodash';

// TODO: skipping on real device because we would need a signed app
describe('uicatalog - load zipped app via url @skip-real-device @skip-ios6', function () {

  let appUrl = 'http://appium.s3.amazonaws.com/WebViewApp7.1.app.zip';

  let session = setup(this, _.defaults({'app': appUrl}, desired));
  let driver = session.driver;

  it('should load a zipped app via url', async () => {
    let el = driver.findElement('class name', 'UIATableView');
    el.should.exist;
  });
});
