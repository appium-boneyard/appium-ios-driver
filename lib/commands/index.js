import findExtensions from './find';
import elementExtensions from './element';
import loggingCommands from './logging';
import gestureExtensions from './gesture';
import alertExtensions from './alert';
import executeExtensions from './execute';

let commands = {};

for(let obj of [
    findExtensions, elementExtensions, loggingCommands, gestureExtensions,
    alertExtensions, executeExtensions
]) {
  Object.assign(commands, obj);
}

export default commands;
