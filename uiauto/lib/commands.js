// The message route is the following:
// Appium <--> Command Proxy <--> Instruments
// The medium between Instruments and Command Proxy is the command-proxy-client
// script.
//
// Command Proxy --> Instruments message format: {cmd:"<CMD>"}
//
// Instruments --> Command Proxy message format:
// <one char message type>,<stringified json data>
// <stringified json data> format:
// {status:<status>, value:<result>}

/* globals $, STATUS, env */

var commands;

(function () {
  var BIG_DATA_THRESHOLD = 50000;
  var MORE_COMMAND = "#more";
  var MESSAGE_TYPES = ['error', 'no data', 'regular', 'chunk', 'last chunk'];

  commands = {};
  var WAIT_FOR_DATA_TIMEOUT = 3600;
  var curAppiumCmdId = -1;

  function BigResult(_result) {
    this.result = _result;
    this.idx = 0;
    this.noMore = function () {
      return this.idx > this.result.length;
    };
    this.messageType = function () {
      return this.noMore() ? MESSAGE_TYPES.indexOf('last chunk') :
        MESSAGE_TYPES.indexOf('chunk');
    };
    this.nextChunk = function () {
      var _this = this;
      var nextIdx = this.idx + BIG_DATA_THRESHOLD;
      var chunk = _this.result.substring(_this.idx, nextIdx);
      this.idx = nextIdx;
      return chunk;
    };
  }
  var bigResult = null;

  var prepareChunk = function (args) {
    var chunk = bigResult.nextChunk();
    args.push(bigResult.messageType() + ',' + chunk);
    if (bigResult.noMore()) bigResult = null;
  };

  var sendResultAndGetNext = function (result) {
    curAppiumCmdId++;
    var args = [env.commandProxyClientPath, env.instrumentsSock];
    if (typeof result !== "undefined") {
      if (result.type === 'chunk') {
        // we responded to the 'more' command
        prepareChunk(args);
      } else {
        var stringResult = JSON.stringify(result);
        $.debug('responding with:' + stringResult.substring(300));
        if (stringResult.length < BIG_DATA_THRESHOLD) {
          // regular small results
          args.push(MESSAGE_TYPES.indexOf('regular') + ',' + stringResult);
        } else {
          // initiating big result transfer
          bigResult = new BigResult(stringResult);
          prepareChunk(args);
        }
      }
    } else {
      args.push(MESSAGE_TYPES.indexOf('no data') + ',');
    }
    var cmd = env.nodePath + " " + args.join(" ");
    var cmdLog = cmd.slice(0, 300) + '...';
    var res;
    try {
      $.debug("Running system command #" + curAppiumCmdId + ": " + cmdLog);
      res = $.system().performTaskWithPathArgumentsTimeout(env.nodePath, args, WAIT_FOR_DATA_TIMEOUT);
    } catch (e) {
      $.debug(e.name + " error getting command " + curAppiumCmdId + ": " + e.message);
      return null;
    }
    if (!res) {
      $.debug("Command proxy client (" + cmd + ") exited with null res");
      return null;
    }
    if (res.exitCode !== 0) {
      $.debug("Command proxy client (" + cmd + ") exited with " + res.exitCode +
                  ", here's stdout:");
      $.debug(res.stdout);
      return null;
    }

    var output = res.stdout.replace(/^(.*\n)*----- OUTPUT -----\r?\n/g, '');
     return JSON.parse(output).cmd;
  };

  var getFirstCommand = function () {
    return sendResultAndGetNext();
  };

  function buildOkResult(rawRes) {
    // Type return mapping is the following:
    // - UIAElement (excluding UIAElementArray and UIAElementNil)
    //   --> return a single element id
    // - UIAElementNil, null, undefined --> ''
    // - UIAElementArray, mechanic wrap, Elements Arrays
    //   --> return array of element ids
    // - else --> return result as it is

    // converting UIAElementArray to mechanic wrap
    if (rawRes instanceof UIAElementArray) {
      rawRes = $.smartWrap(rawRes);
    }
    // converting array of UIAElement to mechanic wrap
    if (Array.isArray(rawRes) && rawRes.length > 0) {
      try {
        rawRes = $.smartWrap(rawRes);
      } catch (ign) {
        // not an array of elements, ignoring
      }
    }
    // build result object
    if (rawRes === UIAElementNil || rawRes instanceof UIAElementNil ||
      rawRes === null || rawRes === undefined) {
      return {
        status: STATUS.Success.code,
        value: ''
      };
    } else if (rawRes instanceof UIAElement) {
      var elid = $.getId(rawRes);
      return {
        status: STATUS.Success.code,
        value: {'ELEMENT': elid }
      };
    } else if (rawRes.isMechanic === true) {
      var elIds = [];
      $(rawRes).each(function (idx, el) {
        var elid = $.getId(el);
        elIds.push({'ELEMENT': elid });
      });
      return {
        status: STATUS.Success.code,
        value: elIds
      };
    } else {
      return {
        status: STATUS.Success.code,
        value: rawRes
      };
    }
  }

  function buildErrorResult(err) {
    $.error('Error during eval: ' + err.stack);
    if (err.isAppium) {
      return {
        status: err.code,
        value: err.message
      };
    } else {
      return {
        status: STATUS.JavaScriptError.code
      , value: err.message
      };
    }
  }

  commands.startProcessing = function () {
    // let server know we're alive and get first command
    var cmd = getFirstCommand();

    while (true) {
      if (cmd) {
        var result;
        $.debug("Got new command " + curAppiumCmdId + " from instruments: " + cmd);
        if (cmd === MORE_COMMAND) {
          result = {
            status: STATUS.Success.code,
            type: 'chunk',
          };
        } else {
          if (cmd.indexOf("$.crash()") === 0) {
            // if we get something that looks like '$.crash()', fail.
            // this is for testing purposes
            throw new Error("Crash!");
          }
          try {
            $.debug('evaluating ' + cmd);
            var rawRes = eval(cmd);
            $.debug('evaluation finished');
            result = buildOkResult(rawRes);
          } catch (err) {
            $.error(err.toString());
            result = buildErrorResult(err);
          }
        }
        cmd = sendResultAndGetNext(result);
      } else {
        throw new Error("Error getting next command, shutting down :-(");
      }
    }
  };

  commands.loopInfinitely = function () {
    $.debug("No command proxy active; just looping infinitely");
    while (true) {
      $.debug("Waiting...");
      $.system().performTaskWithPathArgumentsTimeout('/bin/sleep', [2]);
    }
  };
})();
