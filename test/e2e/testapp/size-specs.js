import setup from "../setup-base";
import desired from './desired';

describe('testapp - size', function () {

  describe('element size', function () {
    let session = setup(this, desired);
    let driver = session.driver;

    it('should return the right element size', async () => {
      let el = await driver.findElement('class name', 'UIAButton');
      let size = await driver.getSize(el);
      size.width.should.exist;
      size.width.should.be.above(60);
      size.height.should.be.above(20);
    });

    it('should return the window size', async () => {
      let size = await driver.getWindowSize();
      size.width.should.exist;
      size.width.should.be.above(319);
      size.height.should.be.above(479);
    });
  });
});
