import { GoogleSpreadsheet } from 'google-spreadsheet';
import logger from '../logger';
import { getCreds } from './serviceCreds';

export const getDoc = async(id: string, creds?: string): Promise<GoogleSpreadsheet> => {
  if (!creds) {
    creds = getCreds();
  }
  const googleCreds = require(creds);
  logger.debug('Getting spreadsheet and logging in')
  const doc = new GoogleSpreadsheet(id);
  await doc.useServiceAccountAuth(googleCreds);
  await doc.loadInfo();
  return doc;
}