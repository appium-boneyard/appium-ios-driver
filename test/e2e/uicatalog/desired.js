import getAppPath from 'sample-apps';
import env from '../helpers/env.js';

module.exports = {
  app: getAppPath('UICatalog', env.REAL_DEVICE),
  noReset: true
};
