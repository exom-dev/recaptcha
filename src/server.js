const express = require('express');
const app = express.Router();

const { isArray } = require('lodash');
const recaptcha = require('../index');

app.post('/', (request, response) => {
  response.json(recaptcha.generate());
});

app.post('/:id', (request, response) => {
  const id = request.params.id;
  response.json(recaptcha.regenerate(id));
});

app.post('/:id/solve', (request, response) => {
  const answer = request.body.answer;
  
  if (isArray(answer) === false) {
    throw `Bad request 'request.body.answer' (expected: array | found: ${typeof(answer)})`;
  }

  const id = request.params.id;
  response.json(recaptcha.solve(id, answer));
});

module.exports = app;
