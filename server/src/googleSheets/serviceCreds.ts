import logger from '../logger';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const getCreds = (): string => {
  logger.debug('Looking for Google Service Account key');
  logger.debug('Will try env var, in this directory and also ~/.google');
  logger.debug('Trying to find key at env var KEY_PATH');
  let keyPath = process.env['KEY_PATH'];
  if (!keyPath || !fs.existsSync(keyPath)) {
    keyPath = path.resolve(path.join('.','privatekey.json'))
    logger.debug(`Trying key in this directory - ${keyPath}`)
  }
  if (!fs.existsSync(keyPath)) {
    keyPath = path.resolve(path.join(os.homedir(), '.google', 'privatekey.json'));
    logger.debug(`Trying key in ${keyPath}`)
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error('Could not find Google Service Account key');
  }
  return keyPath;
}