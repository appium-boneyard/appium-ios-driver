import setup from "../setup-base";
import desired from './desired';

describe('uicatalog - contexts @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('getting contexts should do nothing when no webview open', async () => {
    let contexts = await driver.getContexts();
    contexts.should.have.length(1);
  });
});
