import logger from '../logger';
import { util } from 'appium-support';
import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';

let commands = {}, helpers = {}, extensions = {};

helpers.findElOrEls = async function (strategy, selector, mult, context) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
    // return await this.findWebElementOrElements(strategy, selector, mult, context);
  } else {
    return await this.findUIElementOrElements(strategy, selector, mult, context);
  }
};

helpers.findUIElementOrElements = async function  (strategy, selector, mult, context) {
  if (strategy !== "xpath") {
    selector = util.escapeSpecialChars(selector, "'");
  }
  if (typeof context === "undefined" || !context) {
    context = '';
  } else if (typeof context === "string") {
    context = util.escapeSpecialChars(context, "'");
  }

  // previously getSelectorForStrategy
  if (strategy === 'class name' && selector.indexOf('UIA') !== 0) {
    throw new errors.InvalidSelectorError(
      `The class name selector must use full UIA class names. Try 'UIA${selector}' instead.`);
  }

  if (!selector) new errors.InvalidSelectorError('Missing selector');

  let createGetElementCommand = function (strategy, selector, mult, context) {
    let ext = mult ? 's' : '';
    let command = "";
    context = !context ? context : ", '" + context + "'" ;
    switch (strategy) {
    case "name":
      command = `au.getElement${ext}ByName('${selector}'${context})`;
      break;
    case "accessibility id":
      command = `au.getElement${ext}ByAccessibilityId('${selector}'${context})`;
      break;
    case "id":
      command = `au.getElement${ext}ById('${selector}')`;
      break;
    case "-ios uiautomation":
      command = `au.getElement${ext}ByUIAutomation('${selector}'${context})`;
      break;
    default:
      command = `au.getElement${ext}ByType('${selector}'${context})`;
    }

    return command;
  };

  let getLocalizedStringForSelector = function (selector, strings) {
    let newSelector = selector;
    if (strings) {
      let localizedSelector = strings[selector];
      if (localizedSelector) {
        newSelector = localizedSelector;
      } else {
        logger.debug(
          `Id selector, '${selector}', not found in Localizable.strings.`);
      }
    }

    return newSelector;
  };

  let res;
  let doFind = async () => {
    if (strategy === "xpath") {
      res = this.findUIElementsByXpath(selector, mult, context);
    } else if (strategy === "id") {
      // For the ID strategy, we first want to handle the selector as an
      // accessibility id. If no element is found by that strategy, we fall
      // back to searching for the string.
      let findByAxIdCmd = createGetElementCommand("accessibility id", selector, mult, context);
      res = await this.uiAutoClient.sendCommand(findByAxIdCmd);
      if(!(res && _.size(res) > 0)) {
        // Since no element was found using the accessibility id, we fall
        // back to search by string.
        let findByIdCmd = createGetElementCommand("id", getLocalizedStringForSelector(selector,
          this.caps.localizableStrings), mult, context);
        res = await this.uiAutoClient.sendCommand(findByIdCmd);
      }
    } else {
      let command = createGetElementCommand(strategy, selector, mult, context);
      res = await this.uiAutoClient.sendCommand(command);
   }
    if(mult) {
      return true;
    } else {
      if (!res) {
        throw new errors.NoSuchElementError();
      }
      return _.size(res) > 0;
    }
  };

  await this.implicitWaitForCondition(doFind);
  return res;
};

Object.assign(extensions, commands, helpers);
export { commands, helpers};
export default extensions;
