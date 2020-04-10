import React from 'react';
export interface ITeam {
  teamName: string;
  captain: string;
  scores: {
    [key: string]: null | number; 
  },
  total: number;
}

export interface ILeaderboard {
  title: string;
  rounds: string[];
  teams: ITeam[];
  refreshTime: number;
}

type Props = {}

type State = {
  leaderboardData: null | ILeaderboard;
  refreshTime: number;
}

export default class Leaderboard extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      leaderboardData: null,
      refreshTime: 60000
    }
  }

  componentDidMount() {
    this.getData();
  }

  getData = async () => {
    const response = await fetch('/data');
    const leaderboardData: ILeaderboard = await response.json();
    this.setState({
      leaderboardData,
      refreshTime: leaderboardData.refreshTime
    })
    setTimeout(this.getData, this.state.refreshTime);
  }

  getRoundMinMax = (leaderboardData: ILeaderboard) => {
    type minMax = {[key: string]: {min: null | number, max: null | number}}
    let roundMinMax = leaderboardData.rounds.reduce((cls: minMax, round) => {
      cls[round] = {
        min: null,
        max: null
      }
      return cls
    }, {});

    for (const round of leaderboardData?.rounds) {
      const scores = leaderboardData.teams.map(team => team.scores[round]).filter(score => score !== null);
      //@ts-ignore
      roundMinMax[round].max = Math.max(...scores)
      //@ts-ignore
      roundMinMax[round].min = Math.min(...scores)
    }
    return roundMinMax;
  }

  render() {
    const { leaderboardData } = this.state;
    if (leaderboardData) {
      const roundMinMax = this.getRoundMinMax(leaderboardData);
      return <div>
        <h1>{leaderboardData.title}</h1>
        <table className='table table-striped '>
          <thead>
            <tr>
              <th />
              <th>Team</th>
              { leaderboardData.rounds.map(round => (
                <th key={round} className='text-center rotated-text'><div><span>{round}</span></div></th>
              ))}
              <th className='text-center rotated-text'><div><span>Total</span></div></th>
            </tr>
          </thead>
          <tbody>
            { leaderboardData.teams.map((team, i) => {
              return <tr key={team.teamName}>
                <th>{i+1}</th>
                <td><b>{team.teamName}</b><br/><small>{team.captain}</small></td>
                { leaderboardData.rounds.map(round => {
                  let css = '';
                  if (team.scores[round] && roundMinMax[round].min === team.scores[round]) {
                    css += ' table-danger';
                  }
                  if (team.scores[round] && roundMinMax[round].max === team.scores[round]) {
                    css += ' table-success';
                  }
                  return <td key={`${team.teamName}-${round}`}className={`text-center ${css}`}>{team.scores[round]}</td>
                }) }
                <th className='text-center'>{team.total}</th>
              </tr>
            })}
          </tbody>
        </table>
      </div>
    } else {
      return <h2>Loading...</h2>
    }
  }
}