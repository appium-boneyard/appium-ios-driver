import setup from "../setup-base";
import desired from './desired';
import B from 'bluebird';
import { throwMatchableError } from '../helpers/recipes';

describe('testapp - context methods', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('getting list multiple times should not crash appium', async () => {
    for (let i=0; i<8; i++) {
      let contexts = await driver.getContexts();
      contexts.should.have.length(1);
    }
  });

  it('setting context to \'null\' should work', async () => {
    let contexts = await driver.getContexts();
    contexts.should.have.length(1);
    await driver.setContext(contexts[0]);
    await driver.setContext(null);
  });

  it('setting context to \'NATIVE_APP\' should work', async () => {
    let contexts = await driver.getContexts();
    contexts.should.have.length(1);
    await driver.setContext(contexts[0]);
    await driver.setContext('NATIVE_APP');
  });

  it('setting context to non-existent context should return \'NoSuchContext\' (status: 35)', async () => {
    await B.resolve(driver.setContext('WEBVIEW_42'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 35/);
  });

});
