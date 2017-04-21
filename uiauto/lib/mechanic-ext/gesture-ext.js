/* globals $, ERROR */

(function () {
  $.extend($, {

    // Gesture functions
    tapById: function (elementId) {
      var element = this.getElement(elementId);
      var errObj = new ERROR.UnknownError(
        'elementId ' + elementId + ' could not be tapped');
      if (element !== null) {
        try {
          // element may still be null.
          element.tap();
        } catch (e) {
          if (e.message.indexOf("(null)") !== -1) {
            try {
              $.target().tap(element.rect());
            } catch (e2) {
              throw errObj;
            }
          } else {
            throw errObj;
          }
        }
      } else {
        throw new ERROR.UnknownError(
          'elementId ' + elementId + ' is null and can\'t be tapped.');
      }
    }

  , getAbsCoords: function (startX, startY, endX, endY) {
      if (typeof endX === "undefined") {
        endX = 0;
      }
      if (typeof endY === "undefined") {
        endY = 0;
      }
      var size = $.target().rect().size;
      if (startX === null) {
        startX = size.width / 2;
      }
      if (startY === null) {
        startY = size.height / 2;
      }
      if (Math.abs(startX) < 1) {
        startX = startX * size.width;
      }
      if (Math.abs(startY) < 1) {
        startY = startY * size.height;
      }
      if (Math.abs(endX) < 1) {
        endX = endX * size.width;
      }
      if (Math.abs(endY) < 1) {
        endY = endY * size.height;
      }
      var from = {
        x: parseFloat(startX)
      , y: parseFloat(startY)
      };
      var to = {
        x: parseFloat(endX)
      , y: parseFloat(endY)
      };
      return [from, to];
    }

  , dragApp: function (startX, startY, endX, endY, duration) {
      var coords = this.getAbsCoords(startX, startY, endX, endY);
      duration = parseFloat(duration);

      $.target().dragFromToForDuration(coords[0], coords[1], duration);
    }

  , scrollFirstView: function (direction) {
      var doScroll = function (el) {
        var method = 'scroll' + direction[0].toUpperCase() + direction.slice(1);
        el[method]();
      }.bind(this);
      var scrollTypes = ['scrollview', 'tableview', 'collection'];
      var viewEl;
      for (var i = 0; i < scrollTypes.length; i++) {
        $.debug("Looking for view of type " + scrollTypes[i]);
        viewEl = this.getElementByType(scrollTypes[i]);
        if (viewEl) {
          break;
        }
      }
      if (!viewEl || viewEl.isNil()) {
        throw new Error("Couldn't find an initial view to scroll");
      }
      doScroll(viewEl);
    }

  , flickApp: function (startX, startY, endX, endY) {
      var coords = this.getAbsCoords(startX, startY, endX, endY);

      $.target().flickFromTo(coords[0], coords[1]);
    }

  , pinchClose: function (startX, startY, endX, endY, duration) {
      var coords = this.getAbsCoords(startX, startY, endX, endY);
      duration = parseFloat(duration);

      $.target().pinchCloseFromToForDuration(coords[0], coords[1], duration);
    }

  , pinchOpen: function (startX, startY, endX, endY, duration) {
      var coords = this.getAbsCoords(startX, startY, endX, endY);
      duration = parseFloat(duration);

      $.target().pinchOpenFromToForDuration(coords[0], coords[1], duration);
    }

  , complexTap: function (opts) {
      var coords = this.getAbsCoords(opts.x, opts.y);
      var touchOpts = {
        tapCount: parseInt(opts.tapCount, 10)
      , duration: parseFloat(opts.duration)
      , touchCount: parseInt(opts.touchCount, 10)
      };
      return $.target().tapWithOptions(coords[0], touchOpts);
    }

   // Gesture emulation functions (i.e., making Selenium work)

  , getFlickOpts: function (xSpeed, ySpeed) {
      var size = $.target().rect().size;
      var dX, dY;
      // if we're dealing with numbers between 0 and 1, say it's %
      if (Math.abs(xSpeed) < 1 && Math.abs(ySpeed) < 1) {
        dX = xSpeed * size.width;
        dY = ySpeed * size.height;
      } else {
        // otherwise, pixels!
        dX = xSpeed;
        dY = ySpeed;
      }
      // normalize to screen size
      if (Math.abs(dX) > size.width) {
        dX *= Math.abs(size.width / dX);
      }
      if (Math.abs(dY) > size.height) {
        dY *= Math.abs(size.height / dY);
      }
      var midX = size.width / 2;
      var midY = size.height / 2;

      // translate to flick in the middle of the screen
      var from = {
        x: midX - (dX / 2),
        y: midY - (dY / 2)
      };
      var to = {
        x: midX + (dX / 2),
        y: midY + (dY / 2)
      };
      return [from, to];
    }
    // does a flick in the middle of the screen of size 1/4 of screen
    // using the direction corresponding to xSpeed/ySpeed
  , touchFlickFromSpeed: function (xSpeed, ySpeed) {
      // get x, y of vector that provides the direction given by xSpeed/ySpeed and
      // has length .25
      var opts = this.getFlickOpts(xSpeed, ySpeed);
      $.target().flickFromTo(opts[0], opts[1]);
    }

    // similar to flick but does a longer movement in the direction of the swipe
    // does a swipe in the middle of the screen of size 1/2 of screen
    // using the direction corresponding to xSpeed/ySpeed
  , touchSwipeFromSpeed: function (xSpeed, ySpeed) {
      // get x, y of vector that provides the direction given by xSpeed/ySpeed and
      // has length .50
      var opts = this.getFlickOpts(xSpeed, ySpeed);
      $.target().dragFromToForDuration(opts[0], opts[1], 1);
    }

  });
})();
