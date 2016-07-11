import _ from 'lodash';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};

helpers.doValidateDesiredCaps = function (caps) {
  // make sure that the capabilities have one of `app` or `bundleId`
  if ((caps.browserName || '').toLowerCase() !== 'safari' &&
      !caps.app && ! caps.bundleId) {
    let msg = 'The desired capabilities must include either an app or a bundleId for iOS';
    logger.errorAndThrow(msg);
  }

  // `launchTimeout` is more complex than the validators can easily handle
  // and too specific for a generalized validator of its own
  if (caps.launchTimeout) {
    // it can be a number, a JSON string, or an object
    let msg = 'launchTimeout must be a number, object, or string JSON object';
    if (!_.isNumber(caps.launchTimeout)) {
      if (_.isString(caps.launchTimeout)) {
        // if this is a string, it must be a JSON string
        try {
          // change `launchTimeout` to an object
          caps.launchTimeout = JSON.parse(caps.launchTimeout);
        } catch (err) {
          // it was a string, but not something parsable as JSON
          logger.errorAndThrow(msg);
        }
      }
      if (!_.isObject(caps.launchTimeout)) {
        logger.errorAndThrow(msg);
      }
    }
  }

  // `processArguments` is more complex as it can be a string
  // or a hash
  if (caps.processArguments) {
    if (_.isString(caps.processArguments)) {
      try {
        // try to parse the string as JSON
        caps.processArguments = JSON.parse(caps.processArguments);
      } catch (ign) {
        // if we cannot parse, just leave as a string
      }
    } else if (!_.isObject(caps.processArguments)) {
      logger.errorAndThrow('processArguments must be a string, object, or a string JSON object');
    }
  }

  // finally, return true since the superclass check passed, as did this
  return true;
};


Object.assign(extensions, commands, helpers);
export { commands, helpers, extensions };
export default extensions;
