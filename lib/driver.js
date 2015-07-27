import { BaseDriver } from 'appium-base-driver';

class IosDriver extends BaseDriver {
  constructor(opts, shouldValidateCaps) {
    super(opts, shouldValidateCaps);
  }
}

export {IosDriver};
