/* globals $, ERROR */

(function () {
  var getAlert = function () {
    var alert = $.mainApp().alert();
    if (alert.isValid()) return alert;
    alert = null;
    $('alert').forEach(function (_alert) {
      if (!alert && _alert.isValid()) alert = _alert;
    });

    // If we haven't found an alert yet, check for an iOS 9.3 Safari alert
    if (!alert && parseFloat($.systemVersion) >= 9.3 && $._getElementsByXpath("//UIAScrollView")[0]) {
      // If there's a Safari alert, it's always the first UIAScrollView
      var possibleAlert = $._getElementsByXpath("//UIAScrollView")[0];
      var possibleAlertButtons = possibleAlert.buttons();

      // We're assuming it's a Safari alert if it's a UIAScrollView with a single "Close" button (alert)
      // or both "Cancel" and "OK" buttons (prompt/confirm)
      if ((possibleAlertButtons.length === 1 && possibleAlertButtons[0].name() == "Close") ||
          (possibleAlertButtons.length === 2 && possibleAlertButtons[0].name() == "Cancel"
           && possibleAlertButtons[1].name() == "OK")) {
        alert = possibleAlert;

        // Since our alert doesn't have defaultButton or cancelButton methods, we'll create our own
        alert.defaultButton = function () {
          return this.buttons().length === 2 ? this.buttons()[1] : this.buttons()[0];
        }
        alert.cancelButton = function () {
          return this.buttons()[0];
        }
      }
    }
    return alert || $.nil;
  };

  $.extend($, {
    // Alert-related functions
    getAlertText: function () {
      var alert = getAlert();
      if (alert.isNil()) {
        throw new ERROR.NoAlertOpenError();
      }

      var texts = this.getElementsByType('text', alert);
      // If an alert does not have a title, alert.name() is null, use empty string
      var text = alert.name() || "";
      if (texts.length > 1) {
        // Safari alerts have the URL as a title
        if (text.indexOf('http') === 0 || text === "") {
          text = texts.last().name();
        } else {
          // go through all the text elements and concatenate
          text = null;
          for (var i = 0; i < texts.length; i++) {
            var subtext = texts[i].name();
            if (subtext) {
              // if there is text, append it, otherwise use sub text
              text = text ? text + ' ' + subtext : subtext;
            }
          }
        }
      } else if (parseFloat($.systemVersion) >= 9.3) {
        // iOS 9.3 Safari alerts only have one UIATextView
        texts = this.getElementsByType('UIATextView', alert);
        text = texts[0].name();
      }
      return text;
    }

  , setAlertText: function (text) {
      var alert = getAlert();
      var el = this.getElementByType('textfield', alert);
      if (el && el.isVisible()) {
        el.setValueByType(text);
      } else {
        throw new ERROR.ElementNotVisible(
          "Tried to set text of an alert that wasn't a prompt");
      }
    }

  , acceptAlert: function () {
      var alert = getAlert();
      if (!alert.isNil()) {
        var acceptButton = alert.defaultButton();
        var buttonCount = alert.buttons().length;
        // iOS9.0 returns 'cancel' as the default button.
        if ((parseFloat($.systemVersion) >= 9.0 && buttonCount > 0) ||
            (acceptButton.isNil() && buttonCount > 0)) {
          // last button is accept
          acceptButton = alert.buttons()[buttonCount - 1];
        }
        acceptButton.tap();
        this.waitForAlertToClose(alert);
      } else {
        var ios7AlertButtons = this._getElementsByXpath("actionsheet/button");
        if (ios7AlertButtons.length > 0) {
          ios7AlertButtons[0].tap();
        } else {
          throw new ERROR.UnknownError();
        }
      }
    }

  , alertIsPresent: function () {
      return !getAlert().isNil();
    }

  , dismissAlert: function () {
      var alert = getAlert();
      if (!alert.isNil() && !alert.cancelButton().isNil()) {
        alert.cancelButton().tap();
        this.waitForAlertToClose(alert);
      } else if (!alert.isNil() && alert.buttons().length > 0) {
        alert.buttons()[0].tap(); // first button is dismiss
        this.waitForAlertToClose(alert);
      } else {
        var ios7AlertButtons = this._getElementsByXpath("actionsheet/button");
        if (ios7AlertButtons.length > 0) {
          ios7AlertButtons[ios7AlertButtons.length - 1].tap();
        } else {
          return this.acceptAlert();
        }
      }
    }

  , waitForAlertToClose: function (alert) {
      var isClosed = false
        , i = 0;
      while (!isClosed) {
        i++;
        if (alert.isNil()) {
          isClosed = true;
        } else if (i > 10) {
          // assume another alert popped up
          $.debug("Waited for a while and alert didn't close, moving on");
          isClosed = true;
        } else {
          $.debug("Waiting for alert to close...");
          this.delay(300);
          alert = getAlert();
        }
      }
    }

  });
})();
