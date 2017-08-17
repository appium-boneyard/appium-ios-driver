(function () {

  // does a flick from a center of a specified element (use case: sliders)
  UIAElement.prototype.touchFlick = function (xoffset, yoffset) {
    var options = {
      startOffset : {
        x: 0.5,
        y: 0.5
      },
      endOffset : {
        x: 0.5 + xoffset,
        y: 0.5 + yoffset
      }
    };

    this.flickInsideWithOptions(options);
  };

  UIAElement.prototype.getRelCoords = function (startX, startY, endX, endY) {
    var size = this.rect().size;
    if (startX === null) {
      startX = 0.5;
    }
    if (startY === null) {
      startY = 0.5;
    }
    if (Math.abs(startX) > 1) {
      startX = startX / size.width;
    }
    if (Math.abs(startY) > 1) {
      startY = startY / size.height;
    }
    if (Math.abs(endX) > 1) {
      endX = endX / size.width;
    }
    if (Math.abs(endY) > 1) {
      endY = endY / size.height;
    }
    return {
      startOffset: {
        x: parseFloat(startX)
      , y: parseFloat(startY)
      }
    , endOffset: {
        x: parseFloat(endX)
      , y: parseFloat(endY)
      }
    };
  };

  UIAElement.prototype.drag = function (startX, startY, endX, endY, duration, touchCount) {
    var options = this.getRelCoords(startX, startY, endX, endY);
    options.touchCount = parseInt(touchCount, 10);
    options.duration = parseFloat(duration);

    this.dragInsideWithOptions(options);
  };

  UIAElement.prototype.flick = function (startX, startY, endX, endY, touchCount) {
    var options = this.getRelCoords(startX, startY, endX, endY);
    options.touchCount = touchCount;

    this.flickInsideWithOptions(options);
  };

  UIAElement.prototype.complexTap = function (opts) {
    var coords = this.getRelCoords(opts.x, opts.y, 0, 0);
    opts = {
      tapCount: parseInt(opts.tapCount, 10)
    , duration: parseFloat(opts.duration)
    , touchCount: parseInt(opts.touchCount, 10)
    , tapOffset: coords.startOffset
    };
    return this.tapWithOptions(opts);
  };

})();
