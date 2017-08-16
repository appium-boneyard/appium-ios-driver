/**
 * Created by antonchuev on 8/2/17.
 */

let commands = {}, helpers = {}, extensions = {};

commands.getDevicePixelRatio = async function () {
  const screenHeight = await this.getScreenHeight();
  // There is no way to grab scale from UIAutomation. All devices have scale 2.0 except iPhone 6+, iPhone 6s+, iPhone7+ - 3.0.
  const screenHeightOfPlusDevices = 736;
  const pixelRatio = screenHeight === screenHeightOfPlusDevices ? 3 : 2;
  return pixelRatio;
};

commands.getViewportRect = async function () {
  const statusBarHeight = await this.getStatusBarHeight();
  const windowSize = await this.getWindowSize();
  let viewportRect = {
    left: 0,
    top: statusBarHeight,
    width: windowSize.width,
    height: windowSize.height - statusBarHeight
  };
  return viewportRect;
};

commands.getStatusBarHeight = async function () {
  const command = 'UIATarget.localTarget().frontMostApp().statusBar().rect().size.height;';
  const statusBarHeight = await this.uiAutoClient.sendCommand(command);
  return statusBarHeight;
};

commands.getScreenHeight = async function () {
  const command = 'UIATarget.localTarget().rect().size.height;';
  const screenHeight = await this.uiAutoClient.sendCommand(command);
  return screenHeight;
};

Object.assign(extensions, commands, helpers);
export { commands, helpers};
export default extensions;