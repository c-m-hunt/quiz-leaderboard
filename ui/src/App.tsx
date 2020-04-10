import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Leaderboard from './Leaderboard';

const App = () => {
  return (
    <div className="container">
      <section>
        <Leaderboard />
      </section>
    </div>
  );
}

export default App;
