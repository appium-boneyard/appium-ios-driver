import { errors } from 'appium-base-driver';


let commands = {}, helpers = {}, extensions = {};

commands.endCoverage = async function () {
  throw new errors.NotYetImplementedError();
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
