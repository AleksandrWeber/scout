const express = require('express');
const app = express();

app.post('/comment', (req, res) => {
  const userCode = req.body.script;
  eval(userCode);
});

app.get('/preview', (req, res) => {
  const html = req.query.content;
  document.getElementById('preview').innerHTML = html;
});

function renderComment(event) {
  const value = event.target.value;
  const el = document.createElement('div');
  el.innerHTML = value;
}

module.exports = app;
