import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

const SAFARI_BUNDLE = 'com.apple.mobilesafari';

// once safariLauncher is running and instrumented, this function
// finds the button which launches safari and clicks it.
extensions.clickButtonToLaunchSafari = async function () {
  logger.debug('Attempting to launch Safari from Safari Launcher');
  let el;
  try {
    el = await this.findElement('accessibility id', 'launch safari');
  } catch (err) {
    let msg = 'Could not find button to launch Safari. ' +
              'Make sure you are using the latest version of ' +
              'SafariLauncher that appium is using';
    logger.errorAndThrow(msg);
  }

  try {
    await this.click(el.ELEMENT);
  } catch (err) {
    let msg = `Unable to click the 'launch safari' button of SafariLauncher: ${err.message}`;
    logger.errorAndThrow(msg);
  }

  logger.debug('Clicked button, safari should be launching.');
};


Object.assign(extensions, commands, helpers);
export { commands, helpers, SAFARI_BUNDLE };
export default extensions;
