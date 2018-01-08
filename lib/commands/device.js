let commands = {}, helpers = {}, extensions = {};

// this function is memoized in IOSDriver's constructor
commands.getDevicePixelRatio = async function () {
  const screenHeight = (await this.getWindowSize()).height;
  // There is no way to grab scale from UIAutomation. All devices have scale 2.0 except iPhone 6+, iPhone 6s+, iPhone7+ - 3.0.
  const screenHeightOfPlusDevices = 736;
  return screenHeight === screenHeightOfPlusDevices ? 3.0 : 2.0;
};

commands.getViewportRect = async function () {
  const scale = await this.getDevicePixelRatio();
  // status bar height comes in unscaled, so scale it
  const statusBarHeight = Math.round(await this.getStatusBarHeight() * scale);
  const windowSize = await this.getWindowSize();

  // ios returns coordinates/dimensions in logical pixels, not device pixels,
  // so scale up to device pixels. status bar height is already scaled.
  return {
    left: 0,
    top: statusBarHeight,
    width: windowSize.width * scale,
    height: ((windowSize.height * scale) - statusBarHeight),
  };
};

commands.getStatusBarHeight = async function () {
  const command = 'UIATarget.localTarget().frontMostApp().statusBar().rect().size.height;';
  return await this.uiAutoClient.sendCommand(command);
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
