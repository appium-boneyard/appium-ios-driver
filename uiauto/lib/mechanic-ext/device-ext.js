/* globals $, ERROR */

(function () {
  $.extend($, {
    back: function () {
      var bar = $.mainWindow().navigationBar();
      var button = null;
      var buttons = bar.buttons();
      if (buttons.length === 1) {
        button = buttons[0];
      } else {
        button = buttons.Back;
        if (button && button.type && button.type() === 'UIAElementNil') button = buttons[0];
      }
      try {
        button.tap();
      } catch (e) {
        try {
          // Press "Cancel" on Apptentive
          UIATarget.localTarget().frontMostApp().windows()[0].toolbar().buttons()[0].tap();
        } catch (e) {
          throw new ERROR.UnknownError("Back button is null and can't be tapped.");
        }
      }
    }

  , lock: function (secs) {
      var seconds = parseInt(secs, 10);
      return $.target().lockForDuration(seconds);
    }

    // Use while-loop to wait, (i.e. when the app is backgrounded)
  , wait: function (ms) {
      var now = Date.now();
      while (Date.now() - now < ms);
    }

  , background: function (secs) {
      var seconds = parseInt(secs, 10);
      var version = parseInt($.systemVersion.split(".")[0], 10);
      var bundleId = $.bundleId();
      var appName = $.mainApp().name();
      try {
        if (version >= 9) {
          $.target().deactivateAppForDuration(seconds);
        } else {
          $.backgroundWithRetry(secs);
        }
      } catch (ign) {}

      $.wait(1000); // wait for a second so the app is shown
      if ($.bundleId() === bundleId) {
        return;
      }

      var pi = $.mainWindow().pageIndicators()[0];
      if (!pi.isValid()) {
        var apps = $.mainWindow().scrollViews()[0].elements().toArray();
        $.target().tap(apps[apps.length - 2].hitpoint());
      } else {
        // if the app is not relaunched, the system doesn't even wait
        $.wait(secs * 1000);
        var rt = pi.rect();
        var pt = {x: rt.origin.x + rt.size.width * 0.7, y: rt.origin.y + rt.size.height * 0.5};
        var mainScreen = $.mainWindow().scrollViews()[0];
        while (!mainScreen.buttons().firstWithPredicate("name='" + appName + "' and visible=true").isValid()) {
          $.target().tap(pt);
          $.wait(500);
          if (pi.pageIndex() === pi.pageCount() - 1) {
            break;
          }
        }
        $.target().tap(mainScreen.buttons()[appName].hitpoint());
      }
    }

  , backgroundWithRetry: function (secs) {
      secs = parseInt(secs, 10);
      var x = $.target().deactivateAppForDuration(secs);
      var MAX_RETRY = 5, retry_count = 0;
      while (!x && retry_count < MAX_RETRY) {
        x = $.target().deactivateAppForDuration(secs);
        retry_count += 1;
      }
      return x;
    }

    // Obtaining Device Property Information like Name, OS ver, Model etc
  , getDeviceDetail: function () {
      return {
        deviceName: UIATarget.localTarget().name()
      , deviceModel: UIATarget.localTarget().model()
      , systemName: UIATarget.localTarget().systemName()
      , systemVersion: UIATarget.localTarget().systemVersion()
      };
    }
  });
})();
