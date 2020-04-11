import { sortBy } from 'underscore';
import logger from './logger';
import * as fields from './quiz/fields';
import { getDoc } from './googleSheets/sheets';

export const getQuizData = async (sheetId) => {
  logger.info('--------------------');
  logger.info('UPDATING QUIZ DATA');
  logger.info('--------------------');
  logger.debug('Getting creds');
  const doc = await getDoc(sheetId);
  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
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
        teamScores[round] = parseFloat(row[round]) || null;
        teamScores[round] = teamScores[round] && row[fields.joker] === round ? teamScores[round] * 2 : teamScores[round];
        return teamScores
      }, {}),
    }
  });

  teams = teams.map(team => {
    team.total = Object.values(team.scores).reduce((totalScore: number, score: number) => totalScore + score, 0)
    return team;
  })
  logger.debug(`We have found ${teams.length} teams`);
  teams = sortBy(teams, team => team.total).reverse();
  const quiz = {
    rounds, teams,
    title: process.env['QUIZ_TITLE'],
    refreshTime: process.env['REFRESH_TIME']
  }
  return quiz;
}
