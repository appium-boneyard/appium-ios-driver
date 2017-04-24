## appium-instruments

Wrapper module around iOS [Instruments](https://developer.apple.com/library/watchos/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/index.html) and
[instruments-without-delay](https://github.com/facebook/instruments-without-delay).

*Note*: Issue tracking for this repo has been disabled. Please use the [main Appium issue tracker](https://github.com/appium/appium/issues) instead.

The module exports two objects: `Instruments` (default) and `utils`.

### `utils`

Exposes a number of helper functions.

`rootDir`

- The base of the package, wherever it is installed

`killAllInstruments`

- Kill all `Instruments` processes currently running.

`cleanAllTraces`

- Delete all the trace directories that the system knows of.

`getInstrumentsPath`

- Retrieve the path to the `Instruments` binary.

`getAvailableDevices`

- Retrieve a list of the devices that `Instruments` supports.

`parseLaunchTimeout`

- Get the `launchTimeout` into a standard state. If it is a `String` it is parsed as [JSON](http://www.json.org/). If it is a number, or if the parsed version is a number, it is added to an object as `global` (so that the result is `{global: launchTimeout}`).

`getIwdPath`

- Retrieves the path to the [instruments-without-delay](https://github.com/facebook/instruments-without-delay) binary.

`quickLaunch`

- Launches an instruments test with a default test that immediately passes. In this way we can start a simulator and be notified when it completely launches.

`quickInstruments`

- Factory for making an `Instruments` object with sane defaults.


### `Instruments`

This is the main class, exported as default, for the package. Through this class programs can interact with Apple's Instruments program.

The class has one static class method:

`quickInstruments`

- Factory for making an `Instruments` object with sane defaults.

And a number of object methods:

`constructor`

- args - `opts` - an object with values to be set on the newly created object.
  - app
  - termTimeout - defaults to 5000
  - flakeyRetries - defaults to 0
  - udid
  - bootstrap
  - template
  - withoutDelay
  - processArguments
  - simulatorSdkAndDevice
  - tmpDir - defaults to `/tmp/appium-instruments`
  - traceDir
  - launchTimeout - defaults to 90000
  - webSocket
  - instrumentsPath

`launchOnce` - async

- Launch Instruments without any retries.

`launch` - async

- Launch Instruments up to `flakeyRetries` (specified in constructor) times.

`spawnInstruments` - async

- Actually launch the Instruments process.

`shutdown` - async

- Cleanly shutdown the currently running Instruments process.
