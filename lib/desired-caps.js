

const desiredCapConstraints = {
  platformName: {
    presence: true,
    isString: true,
    inclusion: ['iOS']
  },
  browserName: {
    isString: true,
    inclusion: ['Safari', 'safari']
  },
  app: {
    isString: true
  },

  launchTimeout: {
    // recognize the cap,
    // but validate in the driver#validateDesiredCaps method
  },
  calendarFormat: {
    isString: true
  },
  bundleId: {
    isString: true
  },
  udid: {
    isString: true
  },
  locationServicesEnabled: {
    isBoolean: true
  },
  locationServicesAuthorized: {
    isBoolean: true
  },
  autoAcceptAlerts: {
    isBoolean: true
  },
  autoDismissAlerts: {
    isBoolean: true
  },
  nativeInstrumentsLib: {
    isBoolean: true
  },
  nativeWebTap: {
    isBoolean: true
  },
  safariInitialUrl: {
    isString: true
  },
  safariAllowPopups: {
    isBoolean: true
  },
  safariIgnoreFraudWarning: {
    isBoolean: true
  },
  safariOpenLinksInBackground: {
    isBoolean: true
  },
  keepKeyChains: {
    isBoolean: true
  },
  localizableStringsDir: {
    isString: true
  },
  processArguments: {
    isString: true
  },
  interKeyDelay: {
    isNumber: true
  },
  showIOSLog: {
    isBoolean: true
  },
  sendKeyStrategy: {
    isString: true,
    inclusion: ['oneByOne', 'grouped', 'setValue']
  },
  screenshotWaitTimeout: {
    isNumber: true
  },
  waitForAppScript: {
    isString: true
  },
  webviewConnectRetries: {
    isNumber: true
  },
  appName: {
    isString: true
  }
};

export default desiredCapConstraints;
