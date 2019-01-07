import setup from '../setup-base';
import desired from './desired';
import B from 'bluebird';
import { throwMatchableError } from '../helpers/recipes';

describe('uicatalog - execute', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should do UIAutomation commands if not in web frame', async function () {
    let res = await driver.execute('UIATarget.localTarget().frontMostApp().bundleID()');
    res.should.include('.UICatalog');
  });

  it('should not fail if UIAutomation command blows up', async function () {
    await B.resolve(driver.execute('UIATarget.foobarblah()'))
      .catch(throwMatchableError).should.be.rejectedWith(/jsonwpCode: 17/);
  });

  it('should not fail with quotes', async function () {
    await driver.execute('$.log(\'hi\\\'s\');');
  });

});
