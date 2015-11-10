import setup from "../setup-base";
import env from '../helpers/env';

describe(`safari - context - (${env.DEVICE}) @skip-ios6`, () => {
  let driver;

  setup(this, {
    browserName: 'safari',
    nativeWebTap: true
  }).then((d) => driver = d;);

  it('getting current context should work initially', () => {
    await driver.sleep(500)
    (await driver.currentContext()).should.be.fulfilled;
  });
});
