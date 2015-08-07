import { rimraf } from 'appium-support';
import logger from './logger';

async function removeInstrumentsSocket (sock) {
  logger.debug("Removing any remaining instruments sockets");
  await rimraf(sock);
  logger.debug("Cleaned up instruments socket " + sock);
}

export { removeInstrumentsSocket };
