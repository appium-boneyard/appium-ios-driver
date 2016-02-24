import setup from "../setup-base";
import desired from './desired';
import _ from 'lodash';

describe('testapp - wait-for-apps', function () {

  let test = function (desc, script, checkAfter) {
    script = `env.currentTest = "${desc}"; ${script}`;
    describe(desc, function () {
      let session = setup(this, _.defaults({waitForAppScript: script}, desired));
      let driver = session.driver;

      it('should work', async () => {
        let el = await driver.findElement('class name', 'UIAButton');
        el.should.exist;
        if (checkAfter) {
          (await driver.execute('env.currentTest')).should.equal(desc);
        }
      });
    });
  };

  test('just waiting', '$.delay(5000); true;', true);
  test('waiting for one element', 'target.elements().length > 0;', true);
  test('bad script', 'blagimarg!!;', false);
});

