# Appium iOS Driver

[![NPM version](http://img.shields.io/npm/v/appium-ios-driver.svg)](https://npmjs.org/package/appium-ios-driver)
[![Downloads](http://img.shields.io/npm/dm/appium-ios-driver.svg)](https://npmjs.org/package/appium-ios-driver)
[![Dependency Status](https://david-dm.org/appium/appium-ios-driver/master.svg)](https://david-dm.org/appium/appium-ios-driver/)
[![devDependency Status](https://david-dm.org/appium/appium-ios-driver/master/dev-status.svg)](https://david-dm.org/appium/appium-ios-driver/master#info=devDependencies)

[![Build Status](https://travis-ci.org/appium/appium-ios-driver.svg)](https://travis-ci.org/appium/appium-ios-driver)


Appium iOS Driver is a test automation tool for iOS devices up to an including
iOS 9.3. Appium iOS Driver automates native, hybrid and mobile web apps, tested
on simulators and real devices, using Apples' [UI Automation framework](uiauto.md).
Appium iOS Driver is part of the [Appium](https://github.com/appium/appium)
mobile test automation tool.

To automate iOS devices with a version of iOS greater than 9.3, see [appium-xcuitest-driver](https://github.com/appium/appium-xcuitest-driver).

*Note*: Issue tracking for this repo has been disabled. Please use the [main Appium issue tracker](https://github.com/appium/appium/issues) instead.

## iOS Support
Appium iOS Driver supports iOS versions 8+

## Installation
```bash
npm install appium-ios-driver
```

## Authorization for automation support

On some systems Instruments is not authorized to automate iOS devices. This package
comes with a little utility that pre-authorizes Instruments to run UIAutomation
scripts.

Running the authorization script will bring up an alert that prompts the user
to input their `sudo` password. There is no way around this.

### Command line usage

If this package has been installed globally (either as part of an Appium
installation, with `npm install -g appium`, or individually, with
`npm install -g appium-ios-driver`), a _global_ command line utility will be
installed, so you simply need to invoke it:

```
$ authorize-ios
```

### Programmatic usage

To invoke programmatically (in, for instance, a test runner) is as simple as
importing and invoking the `authorize` function, which returns a
[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises):

```
npm install -S appium-ios-driver
```

```js
import { authorize } from 'appium-ios-driver';

authorize()
  .then(function () {
    console.log('iOS authorized!');
  })
  .catch(function (err) {
    console.error(`Error authorizing: ${err.message}`);
  });
```

## Usage
Import iOS Driver, set [desired capabilities](http://appium.io/slate/en/1.5/?javascript#appium-server-capabilities) and create a session:

```js
import { IosDriver } from `appium-ios-driver`

let defaultCaps = {
  app: 'path/to/your.app',
  platformName: 'iOS',
  deviceName: 'iPhone 6'
};

let driver = new IosDriver();
await driver.createSession(defaultCaps);
```
Run commands:
```js
await driver.setOrientation('LANDSCAPE');
console.log(await driver.getOrientation()); // -> 'LANDSCAPE'
```

## Commands
|          Command           |
|----------------------------|
| `active`                          |
| `asyncScriptTimeout`              |
| `back`                            |
| `background`                      |
| `checkForAlert`                   |
| `clear`                           |
| `click`                           |
| `clickButtonToLaunchSafari`       |
| `clickCoords`                     |
| `clickCurrent`                    |
| `clickWebCoords`                  |
| `closeAlertBeforeTest`            |
| `closeApp`                        |
| `closeWindow`                     |
| `convertElementsForAtoms`         |
| `deleteCookie`                    |
| `deleteCookies`                   |
| `elementDisplayed`                |
| `elementEnabled`                  |
| `elementSelected`                 |
| `execute`                         |
| `executeAsync`                    |
| `executeAtom`                     |
| `executeAtomAsync`                |
| `executeMobile`                   |
| `findElOrEls`                     |
| `findUIElementOrElements`         |
| `findUIElementsByXpath`           |
| `findWebElementOrElements`        |
| `flick`                           |
| `flickElement`                    |
| `forward`                         |
| `getAlertText`                    |
| `getAtomsElement`                 |
| `getAttribute`                    |
| `getContexts`                     |
| `getContextsAndViews`             |
| `getCookies`                      |
| `getCssProperty`                  |
| `getCurrentContext`               |
| `getDeviceTime`                   |
| `getLatestWebviewContextForTitle` |
| `getLocation`                     |
| `getLocationInView`               |
| `getLog`                          |
| `getLogTypes`                     |
| `getName`                         |
| `getOrientation`                  |
| `getPageSource`                   |
| `getScreenshot`                   |
| `getSimFileFullPath`              |
| `getSize`                         |
| `getText`                         |
| `getUrl`                          |
| `getWindowHandle`                 |
| `getWindowHandles`                |
| `getWindowSize`                   |
| `getWindowRect`                   |
| `handleTap`                       |
| `hideKeyboard`                    |
| `initAutoWebview`                 |
| `isWebContext`                    |
| `keys`                            |
| `launchApp`                       |
| `listWebFrames`                   |
| `lock`                            |
| `mobileRotation`                  |
| `mobileScroll`                    |
| `mobileShake`                     |
| `mobileWebNav`                    |
| `moveTo`                          |
| `nativeTap`                       |
| `nativeWebTap`                    |
| `navToInitialWebview`             |
| `navToViewThroughFavorites`       |
| `navToViewWithTitle`              |
| `onPageChange`                    |
| `parseElementResponse`            |
| `parseExecuteResponse`            |
| `parseTouch`                      |
| `performMultiAction`              |
| `performTouch`                    |
| `postAcceptAlert`                 |
| `postDismissAlert`                |
| `pullFile`                        |
| `pullFolder`                      |
| `pushFile`                        |
| `receiveAsyncResponse`            |
| `refresh`                         |
| `setAlertText`                    |
| `setContext`                      |
| `setCookie`                       |
| `setFrame`                        |
| `setGeoLocation`                  |
| `setOrientation`                  |
| `setUrl`                          |
| `setValue`                        |
| `setValueImmediate`               |
| `setWindow`                       |
| `stopRemote`                      |
| `submit`                          |
| `title`                           |
| `translateWebCoords`              |
| `typeAndNavToUrl`                 |
| `useAtomsElement`                 |
| `useNewSafari`                    |
| `waitForAtom`                     |
| `webContextIndex`                 |
| `webFlickElement`                 |
| `xySpeedFlick`                    |

## Insecure Features

These can be enabled when running this driver through Appium, via the `--allow-insecure` or `--relaxed-security` flags.

|Feature Name|Description|
|------------|-----------|
|get_server_logs|Allows retrieving of Appium server logs via the Webdriver log interface|

## Watch code for changes, re-transpile and run unit tests:

```bash
gulp watch
```

## Test

For tests, the default sims required are an iOS 9.2 iPhone 6 and iPad 2, which you can create as follows if one doesn't already exist on your system (use `xcrun simctl list` to check first):

```bash
xcrun simctl create "iPhone 6" "iPhone 6" 9.2
xcrun simctl create "iPad 2" "iPad 2" 9.2
```

Then you can run unit and e2e tests:

```bash
// unit tests:
gulp once

// e2e tests - specify your desired iOS version, for example iOS8.4:
DEVICE=ios84 gulp e2e-test
```
