import yargs from 'yargs';
import logger from './logger';
import { getDoc } from './googleSheets/sheets';
import { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as fields from './quiz/fields';

const options = yargs
  .usage('Usage: -r <numberOfRounds')
  .option('s', {alias: 'sheetid', describe: 'Google Sheets ID', type: 'string', demandOption: true})
  .option('r', {alias: 'rounds', describe: 'Number of rounds', type: 'number', demandOption: true})
  .option('j', {alias: 'joker', describe: 'Include Joker', type: 'boolean', default: false})
  .option('f', {alias: 'force', describe: 'Force overwriting an existing sheet. Will throw error if sheet exists and this flag is not set', type: 'boolean', default: false })
  .option('t', {alias: 'tab', describe: 'Name of the tab on the sheet', type: 'string', default: 'Quiz Results'})
  .option('m', {alias: 'maxteams', describe: 'Max teams', type: 'number', default: 30 })
  .option('k', {alias: 'key', describe: 'Google Service Key location', type: 'string', default: null })
  .argv;

logger.info('Setting up spreadsheet');
logger.info('----------------------');
logger.info(`Sheet ID   ${options.sheetid}`);
logger.info(`Tab name   ${options.tab}`);
logger.info(`Rounds     ${options.rounds}`);
logger.info(`Joker      ${options.joker}`)
logger.info(`Key        ${options.key}`)


const setupSheet = async (options) => {
  const doc = await getDoc(`${options.sheetid}`);
  let sheet: GoogleSpreadsheetWorksheet | null = null;
  for (let checkSheet of doc.sheetsByIndex) {
    if (checkSheet.title === options.tab) {
      if (!options.force) {
        const errMsg = `Tab ${options.tab} exists. Either delete this tab, change the name or set the -f flag`;
        logger.error(errMsg);
        throw Error(errMsg);
      }
      sheet = checkSheet;
      await sheet.clear()
    }
  }
  if (!sheet) {
    sheet = await doc.addSheet({ title: `${options.tab}` });
  }
  if (sheet) {
    const dummyRounds: string[] = [];
    for (let i = 0; i < options.rounds; i++) {
      dummyRounds.push(`Round ${i+1}`);
    }
    let coreHeaders = [
      fields.teamName,
      fields.notes,
      fields.captain,
    ];
    if (options.joker) {
      coreHeaders.push(fields.joker);
    }
    const headers = [ ...coreHeaders, ...dummyRounds, fields.total ];
    await sheet.setHeaderRow(headers);
    const cellRange = `A1:${numberToLetter(headers.length - 1)}${options.maxteams}`;
    await sheet.loadCells(cellRange);
    // Set header formatting
    for (let i = 0; i < headers.length; i++) {
      const cell = sheet.getCell(0, i);
      cell.textFormat = { bold: true };
      cell.borders = { bottom: { width: 1, style: 3 } };
    }
    // Set team formatting
    for (let i = 0; i < options.maxteams; i++) {
      const cell1 = sheet.getCell(i, coreHeaders.length - 1);
      let borders = { right: { width: 1, style: 3 } }
      if (i === 0) {
        borders['bottom'] = { width: 1, style: 3 };
      }
      cell1.textFormat = { bold: true };
      cell1.borders = borders;
      if (i > 0) {
        const cellTotal = sheet.getCell(i, headers.length - 1);
        let totalBorders = { left: { width: 1, style: 3 } }
        if (i === 0) {
          totalBorders['bottom'] = { width: 1, style: 3 };
        }
        cellTotal.textFormat = { bold: true };
        cellTotal.borders = totalBorders;
        const totalFormula = `=SUM(${numberToLetter(coreHeaders.length)}${i + 1}:${numberToLetter(headers.length - 2)}${i + 1})`
        cellTotal.formula = totalFormula;
      }
    }
    await sheet.saveUpdatedCells();
    logger.info('Spreadsheet set up');
  }
}

const numberToLetter = (number: number): string => {
  return String.fromCharCode(65 + number)
}

setupSheet(options);