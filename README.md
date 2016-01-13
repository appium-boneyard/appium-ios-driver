[![Build Status](https://travis-ci.org/appium/appium-ios-driver.svg)](https://travis-ci.org/appium/appium-ios-driver) [![Coverage Status](https://coveralls.io/repos/appium/appium-ios-driver/badge.svg?branch=master&service=github)](https://coveralls.io/github/appium/appium-ios-driver?branch=master)

Appium iOS Driver
===================
Appium iOS Driver is a test automation tool for iOS devices. Appium iOS Driver automates native, hybrid and mobile web apps, tested on simulators and real devices. Appium iOS Driver is part of the [Appium](https://github.com/appium/appium) mobile test automation tool.

## iOS Support
Appium iOS Driver supports iOS versions 8+

## Installation
```
npm install appium-ios-driver
```

## Usage
Import iOS Driver, set [desired capabilities](http://appium.io/slate/en/1.5/?javascript#appium-server-capabilities) and create a session:

```
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
```
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
| `convertElementForAtoms`          |
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
| `getDeviceDateAndTime`            |
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


## Watch code for changes, re-transpile and run unit tests:

```
gulp
```

## Test

For tests, the default sims required are an iOS 9.2 iPhone 6 and iPad 2, which you can create as follows if one doesn't already exist on your system (use `xcrun simctl list` to check first):

```
xcrun simctl create "iPhone 6" "iPhone 6" 9.2
xcrun simctl create "iPad 2" "iPad 2" 9.2
```

Then you can run unit and e2e-tests:

```
gulp once && gulp e2e-test
```

If you don't have iOS 9.2, you can force the tests to use a different version as follows, for example to use iOS 8.4:

```
DEVICE=ios84 gulp e2e-test
```
