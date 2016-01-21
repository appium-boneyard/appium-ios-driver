import setup from "../../setup-base";
import desired from '../desired';
import path from 'path';
import _ from 'lodash';

describe('uicatalog - load app with absolute path', function () {
  let appPath = path.resolve(desired.app);

  let session = setup(this, _.defaults({'app': appPath}, desired));
  let driver = session.driver;

  it('should load with absolute path', async () => {
    path.isAbsolute(appPath).should.be.ok;
    let el = await driver.findElement('class name', 'UIATableView');
    el.should.exist;
  });
});
