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


## Watch

```
npm run watch
```

## Test

```
npm test
```
