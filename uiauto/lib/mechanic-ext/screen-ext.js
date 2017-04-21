/* globals $, ERROR */

(function () {
  $.extend($, {

    // Screen-related functions
    getScreenOrientation: function () {
      var orientation = $.orientation()
        , value = null;
      switch (orientation) {
        case UIA_DEVICE_ORIENTATION_UNKNOWN:
        case UIA_DEVICE_ORIENTATION_FACEUP:
        case UIA_DEVICE_ORIENTATION_FACEDOWN:
          value = "UNKNOWN";
          break;
        case UIA_DEVICE_ORIENTATION_PORTRAIT:
        case UIA_DEVICE_ORIENTATION_PORTRAIT_UPSIDEDOWN:
          value = "PORTRAIT";
          break;
        case UIA_DEVICE_ORIENTATION_LANDSCAPELEFT:
        case UIA_DEVICE_ORIENTATION_LANDSCAPERIGHT:
          value = "LANDSCAPE";
          break;
      }
      if (value !== null) {
        return value;
      } else {
        throw new ERROR.UnknownError('Unsupported Orientation: ' + orientation);
      }
    }

  , setScreenOrientation: function (orientation) {
      if (orientation === "LANDSCAPE") {
        $.orientation(UIA_DEVICE_ORIENTATION_LANDSCAPELEFT);
      } else if (orientation === "PORTRAIT") {
        $.orientation(UIA_DEVICE_ORIENTATION_PORTRAIT);
      } else {
        throw new ERROR.UnknownError('Unsupported orientation: ' + orientation);
      }
      var newOrientation;
      var success = false;
      var i = 0;
      while (!success && i < 20) {
        newOrientation = this.getScreenOrientation();
        success = newOrientation === orientation;
        $.system().performTaskWithPathArgumentsTimeout("/bin/sleep", ['0.1'], 1);
        i++;
      }
      if (success) {
        return newOrientation;
      } else {
        throw new ERROR.UnknownError("Orientation change did not take effect: expected " +
          orientation + " but got " + newOrientation);
      }
    }

  , getWindowSize: function () {
      var size = $.target().rect().size;
      return size;
    }

  , getWindowIndicators: function (win) {
      var activityIndicators = win.activityIndicators();
      var pageIndicators = win.pageIndicators();
      var progressIndicators = win.progressIndicators();

      var indicators = activityIndicators.toArray().concat(
        pageIndicators.toArray(), progressIndicators.toArray());

      // remove bad indicators
      for (var i = indicators.length - 1; i >= 0; i--) {
        if (indicators[i].type() === "UIAElementNil") {
          indicators.splice(i, 1);
        }
        if (indicators[i].isValid() === false) {
          indicators.splice(i, 1);
        }
      }
      return indicators;
    }

  });
})();
