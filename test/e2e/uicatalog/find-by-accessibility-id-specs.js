import env from '../helpers/env';
import setup from "../setup-base";
import desired from './desired';
import { clickButton } from '../helpers/recipes';

describe('uicatalog - find by accessibility id @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  afterEach(async () => {
    await clickButton(driver, 'UICatalog');
  });

  it('should find an element by name beneath another element', async () => {
    let axIdExt = env.IOS8 || env.IOS9 ? '' : ', AAPLActionSheetViewController';
    let el = await driver.findElement('accessibility id', "UICatalog");
    await driver.click(el);
    let el2 = await driver.findElement('accessibility id', `Action Sheets${axIdExt}`);
    el2.should.exist;
  });
});
