let commands = {}, helpers = {}, extensions = {};

commands.getDevicePixelRatio = async function () {
  const screenHeight = await this.getScreenHeight();
  // There is no way to grab scale from UIAutomation. All devices have scale 2.0 except iPhone 6+, iPhone 6s+, iPhone7+ - 3.0.
  const screenHeightOfPlusDevices = 736;
  return screenHeight === screenHeightOfPlusDevices ? 3.0 : 2.0;
};

commands.getViewportRect = async function () {
  const statusBarHeight = await this.getStatusBarHeight();
  const windowSize = await this.getWindowSize();
  return {
    left: 0,
    top: statusBarHeight,
    width: windowSize.width,
    height: windowSize.height - statusBarHeight
  };
};

commands.getStatusBarHeight = async function () {
  const command = 'UIATarget.localTarget().frontMostApp().statusBar().rect().size.height;';
  return await this.uiAutoClient.sendCommand(command);
};

commands.getScreenHeight = async function () {
  const command = 'UIATarget.localTarget().rect().size.height;';
  return await this.uiAutoClient.sendCommand(command);
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;