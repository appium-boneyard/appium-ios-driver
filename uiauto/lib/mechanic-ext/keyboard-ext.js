/* globals $ */

(function () {
  $.extend($, {
    // Keyboard functions
    sendKeysToActiveElement: function (keys) {
      if (this.hasSpecialKeys(keys)) {
        return this.sendKeysToActiveElementSpecial(keys);
      } else {
        $.keyboard().typeString(keys);
      }
    }

  , hasSpecialKeys: function (keys) {
      var numChars = keys.length;
      for (var i = 0; i < numChars; i++){
        if (this.isSpecialKey(keys.charAt(i)))
          return true;
      }
      return false;
    }

  , sendKeysToActiveElementSpecial: function (keys) {
      var numChars = keys.length;
      for (var i = 0; i < numChars; i++){
        this.typeKey(keys.charAt(i));
      }
    }

    // handles some of the special keys in org.openqa.selenium.Keys
  , isSpecialKey: function (k) {
      if (k === '\uE003' || k === '\ue017') // BACKSPACE or DELETE
        return true;
      else if (k === '\uE006' || k === '\uE007') // RETURN ENTER
        return true;
      return false;
    }

  , typeKey: function (k) {
      if (k === '\uE003' || k === '\ue017') { // BACKSPACE or DELETE
        if (parseFloat($.systemVersion) >= 9.1) {
          $.keyboard().keys().delete.tap();
        } else {
          $.keyboard().keys().Delete.tap();
        }
      } else if (k === '\uE006' || k === '\uE007') {// RETURN ENTER
        $.keyboard().typeString("\n");
      } else {
        $.keyboard().typeString(String(k)); // regular key
      }
    }

    , _pressKeyToHideKeyboard: function (keyName) {
      $.debug("Hiding keyboard with keyName " + keyName);
      var key = this.keyboard().buttons()[keyName];

      if (key.isValid()) {
        key.tap();
      } else {
        throw new Error("Invalid key name.");
      }
    }

    , _swipeDownToHideKeyboard: function () {
      $.debug("Hiding keyboard using swipe keyboard");
      var startY = $.mainApp().keyboard().rect().origin.y - 10;
      var endY = $.mainWindow().rect().size.height - 10;
      $.flickApp(0, startY, 0, endY);
    }

    , hideKeyboard: function (strategy, keyName) {
      if ($.mainApp().keyboard().isNil()) {
        return;
      }

      switch (strategy) {
        case 'press':
        case 'pressKey':
          $._pressKeyToHideKeyboard(keyName);
          break;
        case 'swipeDown':
          $._swipeDownToHideKeyboard();
          break;
        case 'tapOut':
        case 'tapOutside':
        case 'default':
          $($.mainWindow()).tap();
          break;
        default:
          throw new Error('Unknown strategy: ' + strategy);
      }

      if (!$.tryWaitForCondition(function () { return $.mainApp().keyboard().isNil(); })) {
        throw new Error("Failed to hide keyboard.");
      }
    }
});
})();
