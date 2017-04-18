import { default as baseSetup } from '../setup-base';


function setup (context, desired, newServer = true) {
  let session = baseSetup(context, desired, {}, false, newServer);

  return session;
}

export { setup };
export default setup;
