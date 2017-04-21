var env;

(function () {

  env = {};
  env.init = function (dynamicEnv) {
    this.nodePath = dynamicEnv.nodePath;
    this.commandProxyClientPath = dynamicEnv.commandProxyClientPath;
    this.instrumentsSock = dynamicEnv.instrumentsSock;
    this.interKeyDelay = dynamicEnv.interKeyDelay;
    this.justLoopInfinitely = dynamicEnv.justLoopInfinitely;
    this.autoAcceptAlerts = dynamicEnv.autoAcceptAlerts;
    this.autoDismissAlerts = dynamicEnv.autoDismissAlerts;
    this.sendKeyStrategy = dynamicEnv.sendKeyStrategy;
    this.initialLocation = dynamicEnv.initialLocation;
  };

})();
