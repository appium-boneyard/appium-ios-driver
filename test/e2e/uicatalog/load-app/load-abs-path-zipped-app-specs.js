import setup from "../../setup-base";
import desired from '../desired';
import path from 'path';
import _ from 'lodash';

describe('uicatalog - load zipped app', function () {
  let appZipPath = path.resolve('test/assets/UICatalog7.1.app.zip');

  let session = setup(this, _.defaults({'app': appZipPath}, desired));
  let driver = session.driver;

  it('should load a zipped app via path', async () => {
    path.isAbsolute(appZipPath).should.be.ok;
    let el = await driver.findElement('class name', 'UIATableView');
    el.should.exist;
  });
});
