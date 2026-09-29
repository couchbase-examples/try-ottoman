const { Ottoman } = require('ottoman');
const dotenv = require('dotenv');
dotenv.config();

const ottoman = new Ottoman({
  modelKey: 'type',
  scopeName: 'inventory',
  // Keys look like `airport_3469`, matching the travel-sample dataset.
  keyGeneratorDelimiter: '_',
});

module.exports = { ottoman };
