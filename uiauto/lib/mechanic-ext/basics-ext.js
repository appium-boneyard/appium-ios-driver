/* globals $ */

(function () {
  var delaySec = $.delay;
  var nil = new UIAElementNil();

  // prototyping does not work when creating UIAElementNil
  nil.isNil = function () { return true; };

  $.extend($, {

    system: function () { return $.target().host(); }

    , target: function () { return UIATarget.localTarget(); }

    , mainWindow: function () { return $.mainApp().mainWindow(); }

    , mainApp: function () {
      var app = null;

      if (!$.tryWaitForCondition(function () {
        app = $.target().frontMostApp();
        return app && app.isValid(); })) {
        throw new Error("No valid frontmost app was found.");
      }

      return app;
    }

    , keyboard: function () {
      var appKeyboard = null;

      if (!$.tryWaitForCondition(function () {
        appKeyboard = $.mainApp().keyboard();
        return appKeyboard && appKeyboard.isValid(); })) {
        throw new Error("Could not locate keyboard.");
      }

      return appKeyboard;
    }

    , bundleId: function () { return $.mainApp().bundleID(); }

    , systemVersion: UIATarget.localTarget().systemVersion()

    // overriding existing delay
    , delay: function (ms) { delaySec.call(this, ms/1000); }

    , logTree: function () {$($.mainApp()).logTree();}

    , debug: function (s) { if ($.isVerbose) UIALogger.logDebug(s); }

    , tryWaitForCondition: function (condition, interval) {
      if (typeof condition !== 'function') {
        throw new Error("Must provide a callback returning a boolean.");
      }

      var i = interval || 20, t = 0;
      var isMet = condition();

      while (t < 3000 && !isMet) {
        t += i;
        $.delay(i);
        isMet = condition();
      }

      return isMet;
    }, nil: nil
  });
})();
