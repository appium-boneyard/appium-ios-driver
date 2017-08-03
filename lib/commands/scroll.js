/**
 * Created by antonchuev on 7/25/17.
 */

import { errors } from 'appium-base-driver';
import { unwrapEl } from '../utils';
import _ from 'lodash';
import logger from '../logger';

const byUIA = '-ios uiautomation';

let commands = {}, helpers = {}, extensions = {};

commands.getScrollableElement = async function () {
  const scrollTypes = ['UIAScrollView', 'UIATableView', 'UIACollectionView', 'UIAWebView'];
  let scrollableElement;
  let command = "";
  for (let i = 0; i < scrollTypes.length; i++) {
    command = `au.getElementByType('${scrollTypes[i]}')`;
    scrollableElement = await this.uiAutoClient.sendCommand(command);
    if (scrollableElement) {
      break;
    }
  }

  if (!scrollableElement) {
    throw new Error("Couldn't find any scrollable element");
  } else {
    return scrollableElement;
  }
};

commands.pageUp = async function(elementId) {
  let isSuccessfullScroll = true;
  try {
    await this.scrollElement(elementId, 'up');
  } catch (err) {
    if (_.includes(err.message, 'kAXErrorFailure')) {
      logger.warn('Received kAXErrorFailure, generally indicating an attempt ' + 'to scroll past the end of the view. Continuing.');
      isSuccessfullScroll = false;
    }  else {
      throw err;
    }
  } finally {
    return isSuccessfullScroll;
  }
};

commands.pageDown = async function(elementId) {
  let isSuccessfullScroll = true;
  try {
    await this.scrollElement(elementId, 'down');
  } catch (err) {
    if (_.includes(err.message, 'kAXErrorFailure')) {
      logger.warn('Received kAXErrorFailure, generally indicating an attempt ' + 'to scroll past the end of the view. Continuing.');
      isSuccessfullScroll = false;
    }  else {
      throw err;
    }
  } finally {
    return isSuccessfullScroll;
  }
};

commands.scrollInside = async function(top = 0, elementId) {
  try {
    let childElements = [];
    childElements = await this.findElementsFromElement(byUIA, '.elements();', elementId);
    if (childElements.length === 0) {
      return;
    }

    let firstChildElement = childElements[0];
    firstChildElement = unwrapEl(firstChildElement);
    const command = `au.getElement('${firstChildElement}').scrollToVisible()`;
    await this.uiAutoClient.sendCommand(command);

    if (top === 0) {
      return;
    }

    await this.flick(undefined, 0, -top);

  } catch (error) {
    throw error;
  }
};

helpers.scrollElement = async function(element, direction) {
  let el = unwrapEl(element);
  if (this.isWebContext()) {
    // not implemented yet in web
    throw new errors.NotYetImplementedError();
  } else {
    direction = _.capitalize(direction);
    let command;
    if (_.isNull(el) || _.isUndefined(el)) {
      // By default, scroll the first scrollview.
      command = `au.scrollFirstView('${direction}')`;
    } else {
      // if element is defined, call scrollLeft, scrollRight, scrollUp, and scrollDown on the element.
      command = `au.getElement('${el}').scroll${direction}()`;
    }
    try {
      await this.uiAutoClient.sendCommand(command);
    } catch (err) {
      throw err;
    }
  }
};

Object.assign(extensions, commands, helpers);
export {commands, helpers};
export default extensions;