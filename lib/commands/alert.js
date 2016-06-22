import { util } from 'appium-support';


let commands = {}, helpers = {}, extensions = {};
import { errors } from 'appium-base-driver';

function handleError (err) {
  if (err.message && err.message.match(/not open/)) {
    throw new errors.NoAlertOpenError();
  } else {
    throw err;
  }
}

commands.getAlertText = async function () {
  try {
    let ret = await this.uiAutoClient.sendCommand("au.getAlertText()");
    return ret;
  } catch (err) {
    handleError(err);
  }
};

commands.setAlertText = async function (text) {
  try {
    text = util.escapeSpecialChars(text, "'");
    await this.uiAutoClient.sendCommand(`au.setAlertText('${text}')`);
  } catch (err) {
    handleError(err);
  }
};

commands.postAcceptAlert = async function () {
  try {
    await this.uiAutoClient.sendCommand("au.acceptAlert()");
  } catch (err) {
    handleError(err);
  }
};

commands.postDismissAlert = async function () {
  try {
    await this.uiAutoClient.sendCommand("au.dismissAlert()");
  } catch (err) {
    handleError(err);
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
