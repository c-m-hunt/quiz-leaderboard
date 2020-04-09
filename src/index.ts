import expressWinston from "express-winston";
import winston from "winston";
import express from "express";
import path from 'path';

import { getQuizData } from './update';

const port = 3001;
const  cors = require('cors')
let quizData;

const startApp = () => {
  const app = express();
  app.use(cors())

  const refreshTime = process.env['REFRESH_TIME'] ? parseInt(process.env['REFRESH_TIME']) : 60000;
  setInterval(async() => {
    console.log("Getting quiz data")
    quizData = await getQuizData();
  }, refreshTime);

  app.use(expressWinston.logger({
    transports: [
      new winston.transports.Console(),
    ],
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
    ignoreRoute: () => false, // optional: allows to skip some log messages based on request and/or response
  }));
  app.use(express.static(path.join(__dirname, '..', 'ui', 'build')));
  
  app.get('/', function(req, res){
    res.sendFile('index.html', { root: path.join(__dirname, 'ui', 'build') } );
  });
  
  app.get('/data', function(req, res){
    res.json(quizData);
  });
  
  app.listen(port, () => {
    winston.info("App listening on port " + port);
  });
}

getQuizData()
  .then(data => {
    quizData = data;
    startApp();
  })