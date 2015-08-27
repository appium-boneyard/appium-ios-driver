import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import  js2xml from "js2xmlparser2";
//import { util } from 'appium-support';

let commands = {}, helpers = {}, extensions = {};

commands.active = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    return await this.uiAutoClient.sendCommand("au.getActiveElement()");
  }
};

commands.hideKeyboard = async function (strategy, ...possibleKeys) {
  possibleKeys.pop(); // last parameter is the session id
  let key = _.find(possibleKeys ,(k) => {return k;});
  strategy = strategy || 'pressKey';
  let cmd = `au.hideKeyboard('${strategy}'`;
  cmd = key ? `${cmd}, '${key}')` : `${cmd})`;
  await this.uiAutoClient.sendCommand(cmd);
};

commands.getPageSource = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let jsonSource = await this.getSourceForElementForXML();
    if (typeof jsonSource === "string") {
      jsonSource = JSON.parse(jsonSource);
    }
    let xmlSource = js2xml("AppiumAUT", jsonSource, {
      wrapArray: {enabled: false, elementName: "element"},
      declaration: {include: true},
      prettyPrinting: {indentString: "    "}
    });
    return xmlSource;
  }
};

commands.back = async function () {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    await this.uiAutoClient.sendCommand("au.back()");
  }
};

commands.background = async function (secs) {
  await this.uiAutoClient.sendCommand(`au.background(${secs})`);
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
