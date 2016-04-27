import setup from "../setup-base";
import { Session } from '../helpers/session';
import desired from './desired';
import B from 'bluebird';
import _ from 'lodash';
import { throwMatchableError } from '../helpers/recipes';


describe('testapp - location - 1 @skip-ci', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should return the right x/y coordinates for getLocation', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    let loc = await driver.getLocation(el);
    [94, 110].should.contain(parseInt(loc.x, 10));
    loc.y.should.be.above(120);
  });

  it('should return the right x/y coordinates for getLocationInView', async () => {
    let el = await driver.findElement('class name', 'UIAButton');
    let loc = await driver.getLocation(el);
    [94, 110].should.contain(parseInt(loc.x, 10));
    loc.y.should.be.above(120);
  });

  it('should not error with valid lat/lon and no options', async () => {
    await driver.setGeoLocation({latitude: -30, longitude: 30});
  });

  it('should error with invalid lat/lon and no options', async () => {
    await B.resolve(driver.setGeoLocation({latitude: -150, longitude: 30}))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 17 latitude/);
  });
});

describe('testapp - location - 2 @skip-ci', function () {
  let session = setup(this, _.defaults(
    {locationServicesAuthorized: true, bundleId: 'io.appium.TestApp'},
    desired), {noReset: true});
  let driver = session.driver;

  it('should be able to be turned on', async () => {
    let el = await driver.findElement('accessibility id', 'locationStatus');
    (await driver.getAttribute('value', el)).should.equal(1);
  });
});

describe('testapp - location - 3 @skip-ci', function () {

  it('should not work without bundleId', async () => {
    let session = new Session(_.defaults({locationServicesAuthorized: true},  desired),
      {'no-retry': true});
    await B.resolve(session.setUp())
      .should.be.rejectedWith(/must set the bundleId/);
  });
});

describe('testapp - location - 4 @skip-ci @skip-real-device', function () {
  let session = setup(this, _.defaults(
    {locationServicesAuthorized: false, bundleId: 'io.appium.TestApp'},
    desired), {noReset: true});
  let driver = session.driver;

  it('should be able to be turned off', async () => {
    let el = await driver.findElement('accessibility id', 'locationStatus');
    (await driver.getAttribute('value', el)).should.equal(0);
  });
});

describe('testapp - location - 5 @skip-ci', function () {
  let session = setup(this, _.defaults({
    locationServicesAuthorized: true,
    bundleId: 'io.appium.TestApp',
    app: 'test/assets/TestApp.zip'
  }, desired), {noReset: true});
  let driver = session.driver;

  it('should be able to be turned on when using a zip/ipa file', async () => {
    let el = await driver.findElement('accessibility id', 'locationStatus');
    (await driver.getAttribute('value', el)).should.equal(1);
  });
});
