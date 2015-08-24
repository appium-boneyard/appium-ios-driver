import { escapeSpecialChars } from 'appium-support';
let commands = {}, helpers = {}, extensions = {};

commands.getAlertText = async function () {
  return await this.uiAutoClient.sendCommand("au.getAlertText()");
};

commands.setAlertText = async function (text) {
  text = escapeSpecialChars(text, "'");
  await this.uiAutoClient.sendCommand("au.setAlertText('" + text + "')");
};

commands.postAcceptAlert = async function () {
  await this.uiAutoClient.sendCommand("au.acceptAlert()");
};

commands.postDismissAlert = async function () {
  await this.uiAutoClient.sendCommand("au.dismissAlert()");
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
