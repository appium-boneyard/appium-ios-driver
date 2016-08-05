import findExtensions from './find';
import elementExtensions from './element';
import loggingCommands from './logging';
import gestureExtensions from './gesture';
import alertExtensions from './alert';
import executeExtensions from './execute';
import generalExtensions from './general';
import contextCommands from './context';
import webCommands from './web';
import orientationCommands from './orientation';
import fileMoveCommands from './file-movement';
import navigationCommands from './navigation';
import screenshotCommands from './screenshot';
import safariCommands from './safari';
import coverageCommands from './coverage';
import timeoutCommands from './timeout';


let commands = {};

for (let obj of [
  findExtensions, elementExtensions, loggingCommands, gestureExtensions,
  alertExtensions, executeExtensions, generalExtensions, contextCommands,
  webCommands, orientationCommands, fileMoveCommands, navigationCommands,
  screenshotCommands, safariCommands, coverageCommands, timeoutCommands
]) {
  Object.assign(commands, obj);
}

let iosCommands = {
  find: findExtensions,
  element: elementExtensions,
  logging: loggingCommands,
  gesture: gestureExtensions,
  alert: alertExtensions,
  execute: executeExtensions,
  general: generalExtensions,
  context: contextCommands,
  web: webCommands,
  orientation: orientationCommands,
  file: fileMoveCommands,
  navigation: navigationCommands,
  screenshot: screenshotCommands,
  safari: safariCommands,
  coverage: coverageCommands,
  timeout: timeoutCommands
};

export default commands;
export { commands, iosCommands };
