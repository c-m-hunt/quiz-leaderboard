import { GoogleSpreadsheet } from 'google-spreadsheet';
import { sortBy } from 'underscore';

const sheetId = process.env['SHEET_ID'];

export const getQuizData = async () => {
  const googleCreds = require('./privatekey.json');
  const doc = new GoogleSpreadsheet(sheetId);
  await doc.useServiceAccountAuth(googleCreds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id]
  await sheet.loadHeaderRow();
  const totalColIdx = sheet.headerValues.indexOf('Total');
  const rounds = sheet.headerValues.filter((round, i) => i >= 2 && i < totalColIdx);  
  const rows = await sheet.getRows({offset: 0, limit: 20});

  let teams = rows.filter(row => row['Team Name'] !== '').map(row => {
    return {
      teamName: row['Team Name'],
      captain: row['Captain'] || null,
      scores: rounds.reduce((teamScores, round) => {
        teamScores[round] = parseInt(row[round]) || null;
        return teamScores
      }, {}),
      total: rounds.reduce((score, round) => {
        return score + (row[round] ? parseInt(row[round]) : 0)
      }, 0)
    }
  });

  teams = sortBy(teams, team => team.total).reverse();
  const quiz = {
    rounds, teams,
    title: process.env['QUIZ_TITLE'],
    refreshTime: process.env['REFRESH_TIME']
  }
  return quiz;
}
