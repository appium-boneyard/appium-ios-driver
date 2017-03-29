import path from 'path';


// this happens a single time, at load-time for the test suite,
// so sync method is not overly problematic
let app = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'assets', 'TestApp.app');

let desired = {
  app,
  noReset: true
};

export default desired;
