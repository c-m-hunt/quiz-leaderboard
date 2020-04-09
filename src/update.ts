import { GoogleSpreadsheet } from 'google-spreadsheet';
import { sortBy } from 'underscore';
import process from 'process';

const sheetId = process.env['SHEET_ID'];

export const getQuizData = async () => {
  const doc = new GoogleSpreadsheet(sheetId);
  await doc.useServiceAccountAuth({
    "private_key": process.env['PRIVATE_KEY'],
    "client_email": process.env['CLIENT_EMAILs'],
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();

  const rounds = sheet.headerValues.filter((round, i) => i >= 2 && i < 8);  
  const rows = await sheet.getRows({offset: 0, limit: 20});

  let teams = rows.filter(row => row['Team Name'] !== '').map(row => {
    return {
      teamName: row['Team Name'],
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
  }
  return quiz;
}
