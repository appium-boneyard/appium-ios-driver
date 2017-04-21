## UI automation

The `appium-ios-driver` uses Apple's UI Automation to automate iOS devices. Appium's
implementation consists of a client, `UIAutoClient`, through which you interact
with the iOS UI Automation framework, and a server which is embedded on the
device, running the commands in the context of the running application.

In addition, there is a tool, `prepareBootstrap`, which builds a script which
will be inserted onto the device. Any code that is necessary for running the
commands can be added through that tool.

### Usage

#### `UIAutoClient`

The client is used to send JavaScript commands to the device. It needs to be
instantiated with a socket location (which defaults to `/tmp/instruments_sock`),
and started, after which commands can be sent using the `sendCommand` method:

```js
import UIAutoClient from 'appium-ios-driver';


let client = new UIAutoClient();
client.start();

// send a command to get the source code for the view
let source = await this.uiAutoClient.sendCommand('au.mainApp().getTreeForXML()');
```

In practice the instantiation of the `UIAutoClient` is usually coupled with
launching instruments for automating the device. This is handled by awaiting the
promises from both that start of `UIAutoClient` and the launch of
[`Instruments`](https://github.com/appium/appium-instruments):

```js
import { uiauto } from 'appium-ios-driver';
import { Instruments, utils } from 'appium-instruments';

let uiAutoClient = new uiauto.UIAutoClient();
let instruments = await utils.quickInstruments();

await B.all([
  uiAutoClient.start().then(() => { instruments.registerLaunch(); }),
  instruments.launch()
]);

let source = await this.uiAutoClient.sendCommand('au.mainApp().getTreeForXML()');
```

#### `prepareBootstrap`

The second important function is `prepareBootstrap`, which is used to create the
script which will be injected into the device. This includes custom Appium UI
Automation code to fix certain functionality, as well as any other code that
necessary.

Basic usage of `prepareBootstrap` creates a file with all of the Appium UI
Automation code collated into one long script, which can then be put onto the
device when launching Instruments:

```js
import { uiauto } from 'appium-ios-driver';

let bootstrapPath = await uiauto.prepareBootstrap();
```

Further, `prepareBootstrap` can take a hash with any of the following values:

- `sock` - the location of the instruments socket (defaults to `/tmp/instruments_sock`)
- `interKeyDelay` - the time, in `ms`, to pause between keystrokes when typing
- `justLoopInfinitely` - tells the server not to stop looking for new commands
- `autoAcceptAlerts` - automatically accept alerts as they arise
- `autoDismissAlerts` - automatically accept alerts as they arise
- `sendKeyStrategy` - the "strategy" for typing. This can be
      - `oneByOne` - type as normal, one key at a time
      - `grouped` - group together keys to be sent all at once
      - `setValue` - bypass the keyboard and directly set the value on the element rather than actually typing

The last option that can be sent in is `imports.pre`, through which is sent an array of paths to any JavaScript files to be added to the generated script. This is the means by which custom libraries can be added to the environment:

```js
import { uiauto } from 'appium-uiauto';

let bootstrapPath = await uiauto.prepareBootstrap({
  sock: '/path/to/my/instruments_socket',
  interKeyDelay: 500,
  justLoopInfinitely: false,
  autoAcceptAlerts: true,
  autoDismissAlerts: true,
  sendKeyStrategy: 'oneByOne',
  imports: {
    pre: [
      '/path/to/my/first/import',
      '/path/to/my/second/import'
    ]
  }
});
```
#### `utils`

The `utils` object has a single helper function, `rotateImage`, which takes the
path to an image, and the degrees to rotate, and executes a custom AppleScript
function to rotate the image appropriately. Used to handle screenshots in Appium.

```js
import { uiauto } from 'appium-uiauto';
import { fs } from 'appium-support';

// set up client as appropriate
// ...

let shotFile = '/path/to/file/for/screenshot';
await uiAutoClient.sendCommand(`au.capture('${shotFile}')`);

// rotate the image
await uiauto.utils.rotateImage(shotPath, -90);

let screenshot = await fs.readFile(shotPath);
```
