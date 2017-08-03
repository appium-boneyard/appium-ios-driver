import logger from '../logger';
import { util } from 'appium-support';
import { errors } from 'appium-base-driver';
import _ from 'lodash';
import js2xml from 'js2xmlparser2';
import XMLDom from 'xmldom';
import xpath from 'xpath';
import B from 'bluebird';
import { unwrapEl } from '../utils';

let commands = {}, helpers = {}, extensions = {};

helpers.findElOrEls = async function (strategy, selector, mult, context) {
  context = unwrapEl(context);
  if (this.isWebContext()) {
    return await this.findWebElementOrElements(strategy, selector, mult, context);
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

  if (!selector) new errors.InvalidSelectorError('Missing selector'); // eslint-disable-line curly

  let createGetElementCommand = function (strategy, selector, mult, context) {
    let ext = mult ? 's' : '';
    let command = "";
    context = !context ? context : `, '${context}'` ;
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
      res = await this.findUIElementsByXpath(selector, mult, context);
    } else if (strategy === "id") {
      // For the ID strategy, we first want to handle the selector as an
      // accessibility id. If no element is found by that strategy, we fall
      // back to searching for the string.
      let findByAxIdCmd = createGetElementCommand("accessibility id", selector, mult, context);
      res = await this.uiAutoClient.sendCommand(findByAxIdCmd);
      if (!(res && _.size(res) > 0)) {
        // Since no element was found using the accessibility id, we fall
        // back to search by string.
        let findByIdCmd = createGetElementCommand("id", getLocalizedStringForSelector(selector,
          this.opts.localizableStrings), mult, context);
        res = await this.uiAutoClient.sendCommand(findByIdCmd);
      }
    } else {
      let command = createGetElementCommand(strategy, selector, mult, context);
      res = await this.uiAutoClient.sendCommand(command);
    }
    return _.size(res) > 0;
  };

  try {
    await this.implicitWaitForCondition(doFind);
  } catch (err) {
    if (err.message && err.message.match(/Condition unmet/)) {
      // condition was not met setting res to empty array
      res = [];
    } else {
      throw err;
    }
  }
  if (mult) {
    return res;
  } else {
    if (!res || _.size(res) === 0) {
      throw new errors.NoSuchElementError();
    }
    return res;
  }
};

let _pathFromDomNode = function (node) {
  let path = null;
  for (let attrObj of _.values(node.attributes)) {
    if (attrObj.name === "path") {
      path = attrObj.value;
    }
  }
  return path;
};

let _xmlSourceFromJson = function (jsonSource) {
  if (typeof jsonSource === "string") {
    jsonSource = JSON.parse(jsonSource);
  }
  return js2xml("AppiumAUT", jsonSource, {
    wrapArray: {enabled: false, elementName: "element"},
    declaration: {include: true},
    prettyPrinting: {indentString: "    "}
  });
};

let _performXpathQueryOnJson = function (selector, jsonSource) {
  let xmlSource = _xmlSourceFromJson(jsonSource);
  let dom = new XMLDom.DOMParser().parseFromString(xmlSource);
  return xpath.select(selector, dom);
};

commands.findUIElementsByXpath = async function (selector, mult, context=null, curRetry=1) {
  let sourceXml;
  try {
    sourceXml = await this.getSourceForElementForXML(context);
  } catch (err) {
    logger.warn("Error getting source, can't continue finding element by XPath");
    throw err;
  }
  let selectedNodes = _performXpathQueryOnJson(selector, sourceXml);

  if (!mult) {
    selectedNodes = selectedNodes.slice(0, 1);
  }
  let indexPaths = [];
  // filter out elements without 'path' attribute
  for (let node of selectedNodes) {
    let ip = _pathFromDomNode(node);
    if (ip !== null) {
      indexPaths.push(ip);
    }
  }

  if (indexPaths.length < 1) {
    // and if we don't have any matching nodes, return the empty array
    return [];
  }

  // otherwise look up the actual element by its index path
  let methodName;
  let methodArgs = [];

  if (!mult) {
    methodName = "getElementByIndexPath";
    methodArgs[0] = `'${indexPaths[0]}'`;
  } else {
    methodName = "getElementsByIndexPaths";
    methodArgs[0] = JSON.stringify(indexPaths);
  }

  if (context) {
    methodArgs[1] = `au.getElement('${context}')`;
  }

  let proxyCmd = `au.${methodName}(${methodArgs.join(", ")})`;

  // having index paths means we think elements should be there. Sometimes
  // uiauto lags in enabling us to get elements, so we retry a few times if
  // it can't find elements we know should be there. see uiauto code
  // for more logic
  let res;
  try {
    res = await this.uiAutoClient.sendCommand(proxyCmd);
  } catch (err) {
    // we get a StaleElementReference if uiauto can't find an element
    // by the path we mentioned
    if (curRetry < 3) {
      logger.debug("Got a warning from uiauto that some index paths " +
                   "could not be resolved, trying again");
      await B.delay(300);
      return await this.findUIElementsByXpath(selector, mult, context, curRetry + 1);
    }
    throw err;
  }
  return res;
};

Object.assign(extensions, commands, helpers);
export { commands, helpers};
export default extensions;
