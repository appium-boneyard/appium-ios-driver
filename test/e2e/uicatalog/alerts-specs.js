"use strict";

import env from '../helpers/env';
import setup from '../setup-base';
import desired from './desired';
import B from 'bluebird';

describe('uicatalog - alerts', function () {

  let alertTag = env.IOS7 ? '@label' : '@value';

  let session = setup(this, desired);
  let driver = session.driver;

  afterEach(async () => {
    try { await driver.back(); } catch (ign) {}
  });

  it('should detect Simple', async () => {
    let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@label,'Alert Views')]");
    await driver.click(el1);
    let el2 = await driver.findElement('xpath', `//UIAStaticText[contains(${alertTag},'Simple')]`);
    await driver.click(el2);
    await B.delay(2000);
    (await driver.getAlertText()).should.include('A Short Title Is Best');
    await driver.postDismissAlert();
  });

  it('should detect Okay', async () => {
    let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@label,'Alert Views')]");
    await driver.click(el1);
    let el2 = await driver.findElement('xpath', `//UIAStaticText[contains(${alertTag},'Okay')]`);
    await driver.click(el2);
    await B.delay(2000);
    (await driver.getAlertText()).should.include('A Short Title Is Best');
    await driver.postAcceptAlert();
  });

  it('should detect Other', async () => {
    let el1 = await driver.findElement('xpath', "//UIAStaticText[contains(@label,'Alert Views')]");
    await driver.click(el1);
    let el2 = await driver.findElement('xpath', `//UIAStaticText[contains(${alertTag},'Other')]`);
    await driver.click(el2);
    await B.delay(2000);
    (await driver.getAlertText()).should.include('A Short Title Is Best');
    await driver.postDismissAlert();
  });
});
