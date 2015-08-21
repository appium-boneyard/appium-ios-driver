import  findExtensions from './find';
import loggingCommands from './logging';

let commands = {};

Object.assign(commands, findExtensions);
Object.assign(commands, loggingCommands);

export default commands;
