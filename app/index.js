const express = require('express');
const app = express();

app.get('/', (_, res) => res.send('Hello'));

function start() {
  const PORT = process.env.PORT || 3000;
  return app.listen(PORT, () => console.log(`Server on ${PORT}`));
}

if (require.main === module) {
  start();                 // CLI mode: node index.js
}

// This is a demo change to trigger auto-docs!
function demoFeature() {
  return "This will generate docs!";
}

console.log("Testing auto-docs workflow!");
module.exports = { app, start };
