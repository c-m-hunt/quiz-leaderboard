import { sortBy } from 'underscore';
import { GoogleSpreadsheetSheet } from 'google-spreadsheet';
import logger from './logger';
import * as fields from './quiz/fields';
import { getDoc, getSheetByTitle } from './googleSheets/sheets';

interface Team {
  teamName: string;
  captain: string;
  scores: { [key: string]: number };
  joker: string;
  total?: number;
}

interface Quiz {
  rounds: Team[];
  title: string;
  refreshTime: number;
}

export const getQuizData = async (docId: string, tab?: string): Promise<Quiz> => {
  logger.info('--------------------');
  logger.info('UPDATING QUIZ DATA');
  logger.info('--------------------');
  logger.debug('Getting creds');
  const doc = await getDoc(docId);
  let sheet: GoogleSpreadsheetSheet | null = null;
  if (tab) {
    sheet = getSheetByTitle(tab, doc);
  }
  if (!sheet) {
    sheet = doc.sheetsByIndex[0];
  }
 
  await sheet.loadHeaderRow();

  const totalColIdx = sheet.headerValues.indexOf(fields.total);
  const captainColIdx = sheet.headerValues.indexOf(fields.captain);
  const jokerIncluded = sheet.headerValues.includes(fields.joker);
  if (jokerIncluded) {
    logger.debug('The quiz does have a joker');
  }
  const roundsStartIdx = jokerIncluded ? sheet.headerValues.indexOf(fields.joker) + 1 : captainColIdx + 1;
  const rounds = sheet.headerValues.filter((round, i) => i >= roundsStartIdx && i < totalColIdx);  
  logger.debug(`We are loading in the following rounds:`)
  logger.debug(`${rounds.join(', ')}`);
  const rows = await sheet.getRows({offset: 0, limit: 50});
  let teams = rows.filter(row => row[fields.teamName] !== '').map(row => {
    return {
      teamName: row[fields.teamName],
      captain: row[fields.captain] || null,
      joker: jokerIncluded ? row[fields.joker] : null,
      scores: rounds.reduce((teamScores, round) => {
        teamScores[round] = row[round] && row[round].length > 0 ? parseFloat(row[round]) : null;
        teamScores[round] = teamScores[round] && row[fields.joker] === round ? teamScores[round] * 2 : teamScores[round];
        return teamScores
      }, {}),
    }
  });

  teams = teams.map(team => {
    team.total = Object.values(team.scores)
      .filter(s => s !== null)
      .reduce((totalScore: number, score: number) => totalScore + score, 0)
    return team;
  })
  logger.debug(`We have found ${teams.length} teams`);
  teams = sortBy(teams, team => team.total).reverse();
  const quiz = {
    rounds, teams,
    title: process.env['QUIZ_TITLE'] || 'Quiz Leaderboard',
    refreshTime: process.env['REFRESH_TIME'] ? parseInt(process.env['REFRESH_TIME']) : 60000
  }
  return quiz;
}