import { errors } from 'appium-base-driver';
import _ from 'lodash';
import B from 'bluebird';
import { unwrapEl } from '../utils';
import logger from '../logger';


let commands = {}, helpers = {}, extensions = {};
const FLICK_MS = 3000;

commands.nativeTap = async function (el) {
  el = unwrapEl(el);
  let command = `au.tapById('${el}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.click = async function (el) {
  el = unwrapEl(el);
  if (this.isWebContext()) {
    if (this.opts.nativeWebTap && !this.isRealDevice()) {
      // atoms-based clicks don't always work in safari 7
      await this.nativeWebTap(el);
    } else {
      let atomsElement = this.useAtomsElement(el);
      return await this.executeAtom('click', [atomsElement]);
    }
  } else {
    if (this.opts.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      await this.nativeTap(el);
    }
  }
};

commands.clickCurrent = async function (/*button*/) {
  if (this.isWebContext()) {
    if (_.isNull(this.curWebCoords)) {
      throw new errors.UnknownError('Cannot call click() before calling moveTo() to set coords');
    }
    await this.clickWebCoords();
  } else {
    if (this.curCoords === null) {
      throw new errors.UnknownError("Cannot call click() before calling moveTo() to set coords");
    }
    await this.clickCoords(this.curCoords);
  }
};

helpers.clickCoords = async function (coords) {
  if (this.opts.useRobot) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    let opts = coords;
    opts.tapCount = 1;
    opts.duration = 0.3;
    opts.touchCount = 1;
    let command = `au.complexTap(${JSON.stringify(opts)})`;
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.mobileRotation = async function (x, y, radius, rotation, touchCount, duration, el) {
  if (this.isWebContext()) {
    throw new errors.NotYetImplementedError();
  }
  el = unwrapEl(el);
  let location = {x, y};
  let options = {duration, radius, rotation, touchCount};
  if (el) {
    if (this.isWebContext()) {
      // not implemented yet in the web
      throw new errors.NotYetImplementedError();
    }
    await this.uiAutoClient.sendCommand(
      // UIAElement.rotateWithOptions takes only one options param.
      `au.getElement('${el}').rotateWithOptions(${JSON.stringify(options)})`);
  } else {
    await this.uiAutoClient.sendCommand(
      `target.rotateWithOptions(${JSON.stringify(location)}, ${JSON.stringify(options)})`);
  }
};

helpers.handleTap = async function (gesture) {
  let options = gesture.options;
  let cmdBase = options.element ? `au.getElement('${options.element}')` :
    'UIATarget.localTarget().frontMostApp()';

  // start by getting the size and position of the element we are tapping
  let rect = await this.uiAutoClient.sendCommand(`${cmdBase}.rect()`);

  // default to center
  let offsetX = 0.5;
  let offsetY = 0.5;

  let size = {w: rect.size.width, h: rect.size.height};

  // default options x/y to center, no matter the container
  options.x = (options.x || (size.w / 2));
  options.y = (options.y || (size.h / 2));

  offsetX = options.x / size.w;
  offsetY = options.y / size.h;

  let opts = {
    tapOffset: {
      x: offsetX,
      y: offsetY
    },
    tapCount: options.count || 1,
    touchCount: 1
  };
  let cmd = `${cmdBase}.tapWithOptions(${JSON.stringify(opts)})`;
  return await this.uiAutoClient.sendCommand(cmd);
};

helpers.isDrag = function (gestures) {
  return (
    gestures.length === 4 &&
    gestures[0].action === 'press' &&
    gestures[1].action === 'wait' &&
    gestures[2].action === 'moveTo' &&
    gestures[3].action === 'release'
  );
};

helpers.isPinchAndZoom = function (gestures) {
  return (
    gestures.length === 3 &&
    gestures[0].action === 'press' &&
    gestures[1].action === 'moveTo' &&
    gestures[2].action === 'release'
  );
};

helpers.getCoordinates = async function(gesture) {
  let el = gesture.options.element;

  // defaults
  let coordinates = {x: 0, y: 0, areOffsets: false};

  // figure out the element coordinates.
  if (el) {
    let command = `au.getElement('${el}').rect()`;
    let rect = await this.uiAutoClient.sendCommand(command);
    let pos = {x: rect.origin.x, y: rect.origin.y};
    let size = {w: rect.size.width, h: rect.size.height};

    // defaults
    let offsetX = 0;
    let offsetY = 0;

    // get the real offsets
    if (gesture.options.x || gesture.options.y) {
      offsetX = (gesture.options.x || 0);
      offsetY = (gesture.options.y || 0);
    } else {
      offsetX = (size.w / 2);
      offsetY = (size.h / 2);
    }

    // apply the offsets
    coordinates.x = pos.x + offsetX;
    coordinates.y = pos.y + offsetY;
  } else {
    // moveTo coordinates are passed in as offsets
    coordinates.areOffsets = (gesture.action === 'moveTo');
    coordinates.x = (gesture.options.x || 0);
    coordinates.y = (gesture.options.y || 0);
  }
  return coordinates;
};

helpers.applyMoveToOffset = function (firstCoordinates, secondCoordinates) {
  if (secondCoordinates.areOffsets) {
    return {
      x: firstCoordinates.x + secondCoordinates.x,
      y: firstCoordinates.y + secondCoordinates.y,
    };
  } else {
    return secondCoordinates;
  }
};

helpers.handleDrag = async function (gestures) {
  // get gestures
  let press = gestures[0];
  let wait = gestures[1];
  let moveTo = gestures[2];

  // get drag data
  let pressCoordinates = await this.getCoordinates(press);
  let duration = (parseInt(wait.options.ms, 10) / 1000);
  let moveToCoordinates = await this.getCoordinates(moveTo);

  // update moveTo coordinates with offset
  moveToCoordinates = this.applyMoveToOffset(pressCoordinates, moveToCoordinates);

  // build drag command
  let dragCommand = (`au.dragApp(` +
    `${pressCoordinates.x}, ${pressCoordinates.y}, ` +
    `${moveToCoordinates.x}, ${moveToCoordinates.y}, ` +
    `${duration})`);

  // execute drag command
  return await this.uiAutoClient.sendCommand(dragCommand);
};

helpers.handlePinchAndZoom = async function (gestures) {
  // get gestures
  let press = gestures[0];
  let moveTo = gestures[1];

  // get pinch data
  let pressCoordinates = await this.getCoordinates(press);
  let moveToCoordinates = await this.getCoordinates(moveTo);

  // update moveTo coordinates with offset
  moveToCoordinates = this.applyMoveToOffset(pressCoordinates, moveToCoordinates);

  // build pinch command
  let pinchCommand = (`au.dragApp(` +
    `${pressCoordinates.x}, ${pressCoordinates.y}, ` +
    `${moveToCoordinates.x}, ${moveToCoordinates.y}`);

  return await this.uiAutoClient.sendCommand(pinchCommand);
};

commands.performTouch = async function (gestures) {
  if (this.isWebContext()) {
    throw new errors.NotYetImplementedError();
  }

  if (gestures.length === 1 && gestures[0].action === 'tap') {
    return await this.handleTap(gestures[0]);
  } else if (this.isDrag(gestures)) {
    return await this.handleDrag(gestures);
  }
  let touchStateObjects = await this.parseTouch(gestures);
  await this.uiAutoClient.sendCommand(`target.touch(${JSON.stringify(touchStateObjects)})`);
};

commands.parseTouch = async function (gestures) {
  // `release` is automatic in iOS
  if (_.last(gestures).action === 'release') {
    gestures.pop();
  }

  let touchStateObjects = [];
  let finishParsing = () => {
    let prevPos = null;

    // we need to change the time (which is now an offset)
    // and the position (which may be an offset)
    let time = 0;
    for (let state of touchStateObjects) {
      if (state.touch[0] === false) {
        // if we have no position (this happens with `wait`) we need the previous one
        state.touch[0] = prevPos;
      } else if (state.touch[0].offset && prevPos) {
        // the current position is an offset
        state.touch[0].x += prevPos.x;
        state.touch[0].y += prevPos.y;
      }
      // prevent wait => press => moveto crash
      if (state.touch[0]) {
        delete state.touch[0].offset;
        prevPos = state.touch[0];
      }


      let timeOffset = state.timeOffset;
      time += timeOffset;
      state.time = time;

      delete state.timeOffset;
    }
  };

  let needsPoint = (action) => {
    return _.includes(['press', 'moveTo', 'tap', 'longPress'], action);
  };

  let cycleThroughGestures = async () => {
    let gesture = gestures.shift();
    if (typeof gesture === "undefined") {
      return finishParsing();
    }
    let tapPoint = false;

    if (needsPoint(gesture.action)) { // press, longPress, moveTo and tap all need a position
      let el = gesture.options.element;
      if (el) {
        let command = `au.getElement('${el}').rect()`;
        let rect = await this.uiAutoClient.sendCommand(command);
        let pos = {x: rect.origin.x, y: rect.origin.y};
        let size = {w: rect.size.width, h: rect.size.height};

        if (gesture.options.x || gesture.options.y) {
          tapPoint = {
            offset: false,
            x: pos.x + (gesture.options.x || 0),
            y: pos.y + (gesture.options.y || 0)
          };
        } else {
          tapPoint = {
            offset: false,
            x: pos.x + (size.w / 2),
            y: pos.y + (size.h / 2)
          };
        }

        let touchStateObject = {
          timeOffset: 0.2,
          touch: [
            tapPoint
          ]
        };
        touchStateObjects.push(touchStateObject);
        await cycleThroughGestures();
      } else {
        // iOS expects absolute coordinates, so we need to save these as offsets
        // and then translate when everything is done
        tapPoint = {
          offset: true,
          x: (gesture.options.x || 0),
          y: (gesture.options.y || 0)
        };
        let touchStateObject = {
          timeOffset: 0.2,
          touch: [
            tapPoint
          ]
        };
        touchStateObjects.push(touchStateObject);
        await cycleThroughGestures();
      }
    } else {
      // in this case we need the previous entry's tap point
      tapPoint = false; // temporary marker
      let offset = 0.2;
      if (gesture.action === 'wait') {
        if (typeof gesture.options.ms !== 'undefined' || gesture.options.ms !== null) {
          offset = (parseInt(gesture.options.ms, 10) / 1000);
        }
      }
      let touchStateObject = {
        timeOffset: offset,
        touch: [
          tapPoint
        ]
      };
      touchStateObjects.push(touchStateObject);
      await cycleThroughGestures();
    }
  };

  await cycleThroughGestures();
  return touchStateObjects;
};

let mergeStates = function (states) {
  let getSlice = function (states, index) {
    let array = [];
    for (let i = 0; i < states.length; i++) {
      array.push(states[i][index]);
    }

    return array;
  };

  let timeSequence = function (states) {
    let seq = [];
    _.each(states, function (state) {
      let times = _.map(state, "time");
      seq = _.union(seq, times);
    });

    return seq.sort();
  };

  // for now we will just assume that the times line up
  let merged = [];
  _.each(timeSequence(states), function (time, index) {
    let slice = getSlice(states, index);
    let obj = {
      time,
      touch: []
    };
    _.each(slice, function (action) {
      obj.touch.push(action.touch[0]);
    });
    merged.push(obj);
  });
  return merged;
};

commands.performMultiAction = async function (actions, el) {
  if (this.isWebContext()) {
    throw new errors.NotYetImplementedError();
  }

  el = unwrapEl(el);
  // TODO: why elementId is not used
  let states = [];
  let cycleThroughActions = async () => {
    let action = actions.shift();

    if (typeof action === "undefined") {
      let mergedStates = mergeStates(states);
      if (this.isPinchAndZoom(mergedStates)) {
        await this.handlePinchAndZoom(mergedStates);
        return;
      } else {
        await this.uiAutoClient.sendCommand (`target.touch(${JSON.stringify(mergedStates)})`);
        return;
      }
    }

    let val = await this.parseTouch(action);
    states.push(val);
    await cycleThroughActions();
  };
  await cycleThroughActions();
};

helpers.mobileScroll = async function (opts={}) {
  let direction = opts.direction;
  let el = opts.element;
  el = unwrapEl(el);
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
      if (!_.includes(err.message, 'kAXErrorFailure')) throw err;

      logger.warn('Received kAXErrorFailure, generally indicating an attempt ' +
                  'to scroll past the end of the view. Continuing.');
    }
  }
};

commands.flick = async function (el, xspeed, yspeed, xoffset, yoffset, speed) {
  el = unwrapEl(el);
  if (_.every([el, xoffset, yoffset, speed], (p) => {return !_.isNull(p) && !_.isUndefined(p);})) {
    await this.flickElement(el, xoffset, yoffset, speed);
  } else if (_.every([xspeed, yspeed], (p) => {return !_.isNull(p) && !_.isUndefined(p);})) {
    await this.xySpeedFlick(xspeed, yspeed);
  } else {
    throw new errors.UnknownError(
      'Bad flick parameters, pass either (xspeed, yspeed) or (element, xoffset, yoffset, speed)!');
  }
};

helpers.xySpeedFlick = async function (xSpeed, ySpeed) {
  let command = `au.touchFlickFromSpeed(${xSpeed},${ySpeed})`;
  await B.all([
    this.uiAutoClient.sendCommand(command),
    B.delay(FLICK_MS)
  ]);
};

helpers.flickElement = async function (el, xoffset, yoffset, speed) {
  el = unwrapEl(el);
  let command = "";
  if (this.isWebContext()) {
    // speed is not used because underlying UIATarget.flickFromTo doesn't support it
    await this.webFlickElement(el, xoffset, yoffset);
  } else {
    command = `au.getElement('${el}').touchFlick(${xoffset},${yoffset},${speed})`;
    await B.all([
      this.uiAutoClient.sendCommand(command),
      B.delay(FLICK_MS)
    ]);
  }
};

// TODO: maybe rename this in mjsonwp
commands.mobileShake = async function () {
  await this.uiAutoClient.sendCommand("au.shake()");
};

commands.moveTo = async function (el, xoffset = 0, yoffset = 0) {
  el = unwrapEl(el);

  if (this.isWebContext()) {
    let {x, y} = await this.getLocation(el);
    let coords = {
      x: x + xoffset,
      y: y + yoffset
    };
    this.curWebCoords = coords;
    let atomsElement = this.useAtomsElement(el);
    let relCoords = {x: xoffset, y: yoffset};
    await this.executeAtom('move_mouse', [atomsElement, relCoords]);
  } else {
    if (_.isNull(el) || _.isUndefined(el)) {
      if (!this.curCoords) {
        throw new errors.UnknownException(
          'Current cursor position unknown, please use moveTo with an element the first time.');
      }
      this.curCoords = {
        x: this.curCoords.x + xoffset,
        y: this.curCoords.y + yoffset
      };
    } else {
      let elPos = await this.getLocation(el);
      this.curCoords = {
        x: elPos.x + xoffset,
        y: elPos.y + yoffset
      };
    }
  }
};

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
