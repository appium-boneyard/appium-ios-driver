import findExtensions from './find';
import elementExtensions from './element';
import loggingCommands from './logging';
import gestureCommands from './gesture';

let commands = {};

for(let obj of [findExtensions, elementExtensions, loggingCommands, gestureCommands]) {
  Object.assign(commands, obj);
}

export default commands;
