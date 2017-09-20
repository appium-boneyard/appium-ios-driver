/**
 * Created by antonchuev on 7/25/17.
 */

import { unwrapEl } from '../utils';

const byUIA = '-ios uiautomation';

let commands = {}, helpers = {}, extensions = {};

commands.scrollInside = async function(top = 0, elementId) {
  try {
    let childElements = [];
    childElements = await this.findElementsFromElement(byUIA, '.elements();', elementId);
    if (childElements.length === 0) {
      return false;
    }

    let firstChildElement = childElements[0];
    firstChildElement = unwrapEl(firstChildElement);
    const command = `au.getElement('${firstChildElement}').scrollToVisible()`;
    await this.uiAutoClient.sendCommand(command);

    if (top === 0) {
      return true;
    }

    await this.flick(undefined, 0, -top);
    return true;

  } catch (error) {
    throw error;
  }
};

Object.assign(extensions, commands, helpers);
export {commands, helpers};
export default extensions;