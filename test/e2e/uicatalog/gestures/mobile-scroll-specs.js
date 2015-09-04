import setup from "../../setup-base";
import desired from '../desired';

describe('uicatalog - gestures - mobile scroll @skip-ios6', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should scroll down and up', async () => {
    let el = await driver.findElement('class name', 'UIATableCell');
    let loc1 = await driver.getLocationInView(el);

    await driver.execute("mobile: scroll", {direction: 'down'});
    let loc2 = await driver.getLocationInView(el);
    loc2.x.should.equal(loc1.x);
    loc2.y.should.not.equal(loc1.y);

    await driver.execute("mobile: scroll", {direction: 'up'});
    let loc3 = await driver.getLocationInView(el);
    loc3.x.should.equal(loc2.x);
    loc3.y.should.not.equal(loc2.y);
  });

  it('should scroll down and up using element', async () => {
    let tableView = await driver.findElement('class name', 'UIATableView');
    let el = await driver.findElement('class name', 'UIATableCell');
    let loc1 = await driver.getLocationInView(el);

    await driver.execute("mobile: scroll", {element: tableView, direction: 'down'});
    let loc2 = await driver.getLocationInView(el);
    loc2.x.should.equal(loc1.x);
    loc2.y.should.not.equal(loc1.y);

    await driver.execute("mobile: scroll", {element: tableView, direction: 'up'});
    let loc3 = await driver.getLocationInView(el);
    loc3.x.should.equal(loc2.x);
    loc3.y.should.not.equal(loc2.y);
  });
});

