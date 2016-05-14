import { errors } from 'appium-base-driver';


let commands = {}, helpers = {}, extensions = {};

commands.back = async function () {
  if (this.isWebContext()) {
    await this.mobileWebNav('back');
  } else {
    await this.uiAutoClient.sendCommand('au.back()');
  }
};

commands.forward = async function () {
  if (this.isWebContext()) {
    await this.mobileWebNav('forward');
  } else {
    throw new errors.NotImplementedError();
  }
};

commands.closeWindow = async function () {
  if (this.isWebContext()) {
    let script = "return window.open('','_self').close();";
    return await this.executeAtom('execute_script', [script, []], true);
  } else {
    throw new errors.NotImplementedError();
  }
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
