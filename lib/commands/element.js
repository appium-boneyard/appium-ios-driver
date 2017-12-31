import { errors } from 'appium-base-driver';
import _ from 'lodash';
import { util } from 'appium-support';
import { unwrapEl } from '../utils';

let commands = {}, helpers = {}, extensions = {};

commands.getAttribute = async function (attribute, el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.getAtomsElement(el);
    if (_.isNull(atomsElement)) {
      throw new errors.UnknownError(`Error converting element ID for using in WD atoms: '${el}'`);
    } else {
      return await this.executeAtom('get_attribute_value', [atomsElement, attribute]);
    }
  } else {
    if (attribute === 'contentSize') {
      return await this.getElementContentSize(el);
    }
    if (_.includes(['label', 'name', 'value', 'values', 'hint'], attribute)) {
      let command = `au.getElement('${el}').${attribute}()`;
      return await this.uiAutoClient.sendCommand(command);
    } else {
      throw new errors.UnknownCommandError(`UIAElements don't have the attribute '${attribute}'`);
    }
  }
};

commands.clear = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    await this.executeAtom('clear', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').setValue('')`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.setValueImmediate = async function (value, el) {
  el = unwrapEl(el);
  value = util.escapeSpecialChars(value, "'");
  let command = `au.getElement('${el}').setValue('${value}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.setValue = async function (value, el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    await this.executeAtom('click', [atomsElement]);
    await this.executeAtom('type', [atomsElement, value]);
  } else {
    if (value instanceof Array) {
      value = value.join("");
    }
    if (typeof value !== 'string') {
      value = value.toString();
    }
    value = util.escapeSpecialChars(value, "'");
    // de-escape \n so it can be used specially
    value = value.replace(/\\\\n/g, "\\n");
    if (this.opts.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      let command = `au.getElement('${el}').setValueByType('${value}')`;
      await this.uiAutoClient.sendCommand(command);
    }
  }
};

commands.getText = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    return await this.executeAtom('get_text', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').text()`;
    let res = await this.uiAutoClient.sendCommand(command);
    // in some cases instruments returns in integer. we only want a string
    res = res ? res.toString() : '';
    return res;
  }
};

commands.elementDisplayed = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    return await this.executeAtom('is_displayed', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').isDisplayed()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementEnabled = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    return await this.executeAtom('is_enabled', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').isEnabled() === 1`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.elementSelected = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    return await this.executeAtom('is_selected', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').isSelected()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getName = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.useAtomsElement(el);
    let script = 'return arguments[0].tagName.toLowerCase()';
    return await this.executeAtom('execute_script', [script, [atomsElement]]);
  } else {
    let command = `au.getElement('${el}').type()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getLocation = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = await this.useAtomsElement(el);
    return await this.executeAtom('get_top_left_coordinates', [atomsElement]);
  } else {
    let command = `au.getElement('${el}').getElementLocation()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getLocationInView = async function (el) {
  return await this.getLocation(el);
};

commands.getSize = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    let atomsElement = this.getAtomsElement(el);
    if (atomsElement === null) {
      throw new errors.UnknownError(`Error converting element ID for using in WD atoms: '${el}'`);
    } else {
      return await this.executeAtom('get_size', [atomsElement]);
    }
  } else {
    let command = `au.getElement('${el}').getElementSize()`;
    return await this.uiAutoClient.sendCommand(command);
  }
};

commands.getElementContentSize = async function (el) {
  el = unwrapEl(el);
  const command = `au.getElement('${el}').childElementsFrames()`;
  const frames = await this.uiAutoClient.sendCommand(command);
  const type = await this.getName(el);

  let contentHeight = 0;
  switch (type) {
    case "UIATableView": {
      const firstElementFrame = _.first(frames);
      const lastElementFrame = _.last(frames);
      contentHeight = lastElementFrame.origin.y + lastElementFrame.size.height - firstElementFrame.origin.y;
      break;
    }
    case "UIACollectionView": {
      let firstElementFrame = _.first(frames);
      let elementsInRow = 0;

      // Get number of elements in a row
      for (const [i, frame] of frames.entries()) {
        if (frame.origin.y !== firstElementFrame.origin.y) {
          elementsInRow = i;
          break;
        }
      }

      const spaceBetweenElements = frames[elementsInRow].origin.y - frames[elementsInRow - 1].origin.y - frames[elementsInRow - 1].size.height;
      const numberOfRows = Math.ceil(frames.length / elementsInRow);

      // Assume that all cells are of the same size
      contentHeight = numberOfRows * firstElementFrame.size.height + spaceBetweenElements * (numberOfRows - 1);
      break;
    }
    default: {
      // This method calculates content size only for UIATableView and UIACollectionView. UIAWebView is comming soon.
      return null;
    }
  }

  const size = await this.getSize(el);
  const topLeftCoord = await this.getLocationInView(el);

  return JSON.stringify({
    width: size.width,
    height: size.height,
    top: topLeftCoord.y,
    left: topLeftCoord.x,
    scrollableOffset: contentHeight
  });
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
