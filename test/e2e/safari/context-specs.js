import setup from "../setup-base";
import env from '../helpers/env';
import B from 'bluebird';

describe(`safari - context - (${env.DEVICE}) @skip-ios6`, function() {
  const driver = setup(this, {
    browserName: 'safari',
    nativeWebTap: true
  }).driver;

  it('getting current context should work initially', async () => {
    await B.delay(500);
    (await driver.getCurrentContext()).should.be.ok;
  });
});
