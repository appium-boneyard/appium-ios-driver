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

let commands = {};

for(let obj of [
    findExtensions, elementExtensions, loggingCommands, gestureExtensions,
    alertExtensions, executeExtensions, generalExtensions, contextCommands,
    webCommands, orientationCommands, fileMoveCommands
]) {
  Object.assign(commands, obj);
}

export default commands;
