import findExtensions from './find';
import elementExtensions from './element';
import loggingCommands from './logging';

let commands = {};

Object.assign(commands, findExtensions);
Object.assign(commands, elementExtensions);
Object.assign(commands, loggingCommands);

export default commands;
