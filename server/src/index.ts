import expressWinston from "express-winston";
import logger from './logger';
import express from "express";
import path from 'path';

import { getQuizData } from './update';

const port = 3001;
const cors = require('cors')
const docId = process.env['DOC_ID'];
if (!docId) {
  throw Error('No doc ID set');
}
let quizData;

const startApp = () => {
  const app = express();
  app.use(cors())

  // @ts-ignore
  const refreshTime: number = process.env['REFRESH_TIME'] ? parseInt(process.env['REFRESH_TIME']) : 60000;

  logger.info(`Refresh time set to ${refreshTime / 1000} seconds`);
  logger.debug('Setting up server');

  setInterval(async() => {
    quizData = await getQuizData(docId);
  }, refreshTime);

  app.use(expressWinston.logger({
    transports: logger.transports,
    format: logger.format,
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
    logger.info("App listening on port " + port);
  });
}

getQuizData(docId)
  .then(data => {
    quizData = data;
    startApp();
  })