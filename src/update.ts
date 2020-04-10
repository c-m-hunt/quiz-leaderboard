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

  const joker = 'Joker';
  const captain = 'Captain';
  const total = 'Total';
  const teamName = 'Team Name';

  const totalColIdx = sheet.headerValues.indexOf(total);
  const captainColIdx = sheet.headerValues.indexOf(captain);
  const jokerIncluded = sheet.headerValues.includes(joker);
  const roundsStartIdx = jokerIncluded ? sheet.headerValues.indexOf(joker) + 1 : captainColIdx + 1;
  const rounds = sheet.headerValues.filter((round, i) => i >= roundsStartIdx && i < totalColIdx);  
  const rows = await sheet.getRows({offset: 0, limit: 50});
  let teams = rows.filter(row => row[teamName] !== '').map(row => {
    return {
      teamName: row[teamName],
      captain: row[captain] || null,
      joker: jokerIncluded ? row[joker] : null,
      scores: rounds.reduce((teamScores, round) => {
        teamScores[round] = parseFloat(row[round]) || null;
        teamScores[round] = teamScores[round] && row[joker] === round ? teamScores[round] * 2 : teamScores[round];
        return teamScores
      }, {}),
    }
  });

  teams = teams.map(team => {
    team.total = Object.values(team.scores).reduce((totalScore: number, score: number) => totalScore + score, 0)
    return team;
  })

  teams = sortBy(teams, team => team.total).reverse();
  const quiz = {
    rounds, teams,
    title: process.env['QUIZ_TITLE'],
    refreshTime: process.env['REFRESH_TIME']
  }
  return quiz;
}
