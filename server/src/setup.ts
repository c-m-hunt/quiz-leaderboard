#!/usr/bin/env ts-node

import inquirer, { QuestionCollection } from 'inquirer';
import clear from 'clear';
import { promisify } from 'util';
import figlet from 'figlet';
import logger from './logger';
import { getDoc, getSheetByTitle } from './googleSheets/sheets';
import { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import * as fields from './quiz/fields';

const figletProm = promisify(figlet);

const getOptions = async() => {
  const title = await figletProm('Quiz Setup');
  console.log(title);
  const questions: QuestionCollection = [{
    type: 'input',
    name: 'sheetid',
    message: 'Enter the ID for the Google Sheets doc',
    validate: (value) => {
      if (value.length < 10) {
        return 'Please ensure the ID is at least 10 characters';
      }
      return true;
    },
    filter: value => value.trim()
  },{
    type: 'input',
    name: 'tab',
    message: 'Enter the table name for the quiz',
    validate: (value) => {
      if (value.length < 3) {
        return 'Ensure that the tab name is at least 3 characters';
      }
      return true;
    },
    default: 'Quiz Results'
  },{
    type: 'confirm',
    name: 'force',
    message: 'Overwrite tab contents if tab exists?',
    default: false
  },{
    type: 'number',
    name: 'rounds',
    message: 'How many rounds are you planning? (This can be changed later)',
    validate: (value) => {
      if (!Number.isInteger(parseFloat(value))) {
        return 'Please enter a valid number';
      }
      if (value < 1) {
        return 'There must be at least one round';
      }
      if (value > 20) {
        return 'Max rounds 20'
      }
      return true;
    },
    default: 5
  },{
    type: 'number',
    name: 'maxTeams',
    message: 'What is the maximum amount of teams?',
    validate: (value) => {
      if (!Number.isInteger(parseFloat(value))) {
        return 'Please enter a valid number';
      }
      if (value < 1) {
        return 'There must be at least one tea,';
      }
      if (value > 50) {
        return 'Max rounds 50'
      }
      return true;
    },
    default: 20
  },{
    type: 'confirm',
    name: 'joker',
    message: 'Are teams going to be using a joker?',
    default: false
  },{
    type: 'input',
    name: 'key',
    message: 'Where is the location of Google Service Account key? Leave blank for auto search',
    default: null,
    filter: (value) => {
      if (value === '') {
        return null
      }
      return value;
    }
  }]
  const answers = await inquirer.prompt(questions);
  return answers;
}

const setupSheet = async (options) => {
  logger.info('Setting up spreadsheet');
  logger.info('----------------------');
  logger.info(`Sheet ID   ${options.sheetid}`);
  logger.info(`Tab name   ${options.tab}`);
  logger.info(`Rounds     ${options.rounds}`);
  logger.info(`Joker      ${options.joker}`)
  logger.info(`Key        ${options.key}`)
  const doc = await getDoc(`${options.sheetid}`);
  let sheet: GoogleSpreadsheetWorksheet | null = null;
  try {
    sheet = getSheetByTitle(options.tab, doc);
  } catch (ex) {
    // Yay - doesn't exist
  }
  if (!options.force && sheet) {
    const errMsg = `Tab ${options.tab} exists. Either delete this tab, change the name or set the -f flag`;
    logger.error(errMsg);
    throw Error(errMsg);
  }
  if (options.force && sheet) {
    await sheet.clear()
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
    const cellRange = `A1:${numberToLetter(headers.length - 1)}${options.maxTeams}`;
    await sheet.loadCells(cellRange);
    // Set header formatting
    for (let i = 0; i < headers.length; i++) {
      const cell = sheet.getCell(0, i);
      cell.textFormat = { bold: true };
      cell.borders = { bottom: { width: 1, style: 3 } };
    }
    // Set team formatting
    for (let i = 0; i < options.maxTeams; i++) {
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

clear();
getOptions()
  .then(options => {
    setupSheet(options);
  });