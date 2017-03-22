import path from 'path';


// this happens a single time, at load-time for the test suite,
// so sync method is not overly problematic
let app = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'assets', 'UICatalog.app');

module.exports = {
  app,
  noReset: true
};
