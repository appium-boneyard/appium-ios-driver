import { errors } from 'appium-base-driver';


let commands = {}, helpers = {}, extensions = {};

commands.endCoverage = async function endCoverage () { // eslint-disable-line require-await
  throw new errors.NotYetImplementedError();
};


Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
