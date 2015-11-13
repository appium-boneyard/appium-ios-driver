import setup from "../setup-base";
import env from '../helpers/env';

describe(`safari - context - (${env.DEVICE}) @skip-ios6`, function() {
  const driver = setup(this, {
    browserName: 'safari',
    nativeWebTap: true
  }).driver;

  it('getting current context should work initially', async () => {
    await driver.sleep(500)
    (await driver.currentContext()).should.be.fulfilled;
  });
});
