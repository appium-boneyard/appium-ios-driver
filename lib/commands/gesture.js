import { errors } from 'mobile-json-wire-protocol';
import _ from 'lodash';
import B from 'bluebird';

let commands = {}, helpers = {}, extensions = {};
const FLICK_MS = 3000;

commands.nativeTap = async function (elementId) {
  let command = `au.tapById('${elementId}')`;
  await this.uiAutoClient.sendCommand(command);
};

commands.click = async function (elementId, cb) {
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    if (this.useRobot) {
      /* TODO */throw new errors.NotYetImplementedError();
    } else {
      await this.nativeTap(elementId, cb);
    }
  }
};

commands.mobileRotation = async function (x, y, radius, rotation, touchCount, duration, elId) {
  let location = {'x' : x, 'y' : y};
  let options = {'duration' : duration, 'radius' : radius, 'rotation' : rotation, 'touchCount' : touchCount};
  if (elId) {
    if (this.isWebContext()) {
      throw new errors.NotYetImplementedError();
    }
    await this.uiAutoClient.sendCommand(
      `au.getElement('${elId}').rotateWithOptions(${JSON.stringify(location)},${JSON.stringify(options)})`);
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

commands.performTouch = async function (gestures) {
  if (gestures.length === 1 && gestures[0].action === 'tap') {
    return await this.handleTap(gestures[0]);
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
    return _.contains(['press', 'moveTo', 'tap', 'longPress'], action);
  };

  let cycleThroughGestures = async function () {
    let gesture = gestures.shift();
    if (typeof gesture === "undefined") {
      return finishParsing();
    }
    let tapPoint = false;

    if (needsPoint(gesture.action)) { // press, longPress, moveTo and tap all need a position
      let elementId = gesture.options.element;
      if (elementId) {
        let command = `au.getElement('${elementId}').rect()`;
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
          offset = (parseInt(gesture.options.ms) / 1000);
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
  }.bind(this);

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
      let times = _.pluck(state, "time");
      seq = _.union(seq, times);
    });

    return seq.sort();
  };

  // for now we will just assume that the times line up
  let merged = [];
  _.each(timeSequence(states), function (time, index) {
    let slice = getSlice(states, index);
    let obj = {
      time: time,
      touch: []
    };
    _.each(slice, function (action) {
      obj.touch.push(action.touch[0]);
    });
    merged.push(obj);
  });
  return merged;
};

commands.performMultiAction = async function (actions/*, elementId*/) {
  // TODO: why elementId is not used
  let states = [];
  let cycleThroughActions = async function () {
    let action = actions.shift();

    if (typeof action === "undefined") {
      let mergedStates = mergeStates(states);
      await this.uiAutoClient.sendCommand (`target.touch(${JSON.stringify(mergedStates)})`);
      return;
    }

    let val = await this.parseTouch(action);
    states.push(val);
    await cycleThroughActions();
  }.bind(this);
  await cycleThroughActions();
};

helpers.mobileScroll = async function (opts={}) {
  let {element, direction} = opts;
  if (this.isWebContext()) {
    /* TODO */throw new errors.NotYetImplementedError();
  } else {
    direction = direction.charAt(0).toUpperCase() + direction.slice(1);
    let command;
    if (_.isNull(element) || _.isUndefined(element)) {
      // By default, scroll the first scrollview.
      command = `au.scrollFirstView('${direction}')`;
    } else {
      // if elementId is defined, call scrollLeft, scrollRight, scrollUp, and scrollDown on the element.
      command = `au.getElement('${element}').scroll${direction}()`;
    }
    await this.uiAutoClient.sendCommand(command);
  }
};

commands.flick = async function (element, xspeed, yspeed, xoffset, yoffset, speed) {
  if (_.all([element,xoffset, yoffset, speed], (p) => {return !_.isNull(p) && !_.isUndefined(p); })) {
    await this.flickElement(element, xoffset, yoffset, speed);
  } else if (_.all([xspeed, yspeed], (p) => {return !_.isNull(p) && !_.isUndefined(p); })) {
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

helpers.flickElement = async function (elementId, xoffset, yoffset, speed) {
  let command = "";
  if (this.isWebContext()) {
    /* TODO */ throw new errors.NotYetImplementedError();
  } else {
    command = `au.getElement('${elementId}').touchFlick(${xoffset},${yoffset},${speed})`;
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

Object.assign(extensions, commands, helpers);
export { commands, helpers };
export default extensions;
