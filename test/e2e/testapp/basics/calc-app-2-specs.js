import setup from "../../setup-base";
import desired from '../desired';
import B from 'bluebird';
import { throwMatchableError } from '../../helpers/recipes';
import path from 'path';
import { fs } from 'appium-support';
import _ from 'lodash';

describe('testapp - basics - calc app 2', function () {
  let session = setup(this, desired);
  let driver = session.driver;

  it('should lookup two fields by name and populate them with ' +
      'random numbers to finally sum them up', async () => {
    let sum = 0;
    let lookup = async function (textFieldNum) {
      let num = Math.round(Math.random() * 10000);
      sum += num;
      let el = await driver.findElement('accessibility id', `TextField${textFieldNum}`);
      await driver.setValue(num, el);
    };

    let answer = await driver.findElement('accessibility id', 'Answer');
    await lookup(1);
    await lookup(2);
    let button = await driver.findElement('accessibility id', 'ComputeSumButton');
    await driver.click(button);
    let res = parseInt(await driver.getText(answer), 10);
    res.should.equal(sum);
  });

  it('should receive correct error', async () => {
    await B.resolve(driver.execute("mobile: doesn't exist"))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 9/);
  });

  it('should be able to get syslog log type', async () => {
    let logTypes = await driver.getLogTypes();
    logTypes.should.include('syslog');
    logTypes.should.include('crashlog');
    logTypes.should.not.include('logcat');
  });

  // TODO: Fails on sauce, investigate
  // TODO: Fails with 8.4 or Appium 1.5, investigate cause
  it.skip('should be able to get syslog logs @skip-ios8 @skip-ci', async () => {
    await driver.implicitWait(4000);
    await B.resolve(driver.findElement('accessibility id', 'SumLabelz'))
      .catch(throwMatchableError)
      .should.be.rejectedWith(/jsonwpCode: 7/);
    let logs = await driver.getLog();
    logs.length.should.be.above(0);
    logs[0].message.should.not.include("\n");
    logs[0].level.should.equal("ALL");
    logs[0].timestamp.should.exist;
  });

  it('should be able to get crashlog logs @skip-ci', async () => {
    let dir = path.resolve(process.env.HOME, "Library", "Logs", "DiagnosticReports");
    let msg = 'boom';
    let logs = await driver.getLog('crashlog');
    await fs.writeFile(`${dir}/myApp_${Date.parse(new Date())}_rocksauce.crash`, msg);
    logs = await driver.getLog('crashlog');
    logs.length.should.equal(1);
    _.last(logs).message.should.not.include("\n");
    _.last(logs).message.should.equal(msg);
    _.last(logs).level.should.equal("ALL");
    _.last(logs).timestamp.should.exist;
    logs = await driver.getLog('crashlog');
    logs.length.should.equal(0);
  });

});
