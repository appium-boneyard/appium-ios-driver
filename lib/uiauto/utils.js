import path from 'path';
import { exec } from 'teen_process';
import logger from './logger';


const ROTATE_SCRIPT_PATH = path.resolve(__dirname, '..', '..', '..', 'osa', 'Rotate.applescript');

async function rotateImage (imgPath, deg) {
  logger.debug(`Rotating image '${imgPath}' ${deg} degrees`);
  await exec('osascript', [ROTATE_SCRIPT_PATH, imgPath, deg]);
}

export { rotateImage };
