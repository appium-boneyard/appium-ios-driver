/* global $, env */

var alerts;

(function () {
  alerts = {};
  alerts.configure = function () {
    UIATarget.onAlert = function (alert) {
      if (alert.name() && alert.name().indexOf("attempting to open a pop-up") !== -1 && alert.buttons().length > 0) {
        $.acceptAlert();
      } else if (env.autoAcceptAlerts && alert.buttons().length > 0) {
        $.acceptAlert();
      } else if (env.autoDismissAlerts && alert.buttons().length > 0) {
        $.dismissAlert();
      }
      return true;
    };
  };
})();
