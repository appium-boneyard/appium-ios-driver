import getAppPath from 'sample-apps';
import env from '../helpers/env';

let desired = {
  app: getAppPath('TestApp', env.REAL_DEVICE)
};

export default desired;
