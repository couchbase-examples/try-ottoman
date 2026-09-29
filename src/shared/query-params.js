const { ValidationError } = require('ottoman');

/**
 * Reads an optional integer query param, so bad input is a 400 instead of a failed query.
 * @param query the request's query object
 * @param name of the query param
 * @param defaultValue used when the param is missing
 * @param range inclusive bounds the value must fall within
 */
const parseIntParam = (query, name, defaultValue, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const raw = query[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    const range = max === Number.MAX_SAFE_INTEGER ? `>= ${min}` : `between ${min} and ${max}`;
    throw new ValidationError(`Query param "${name}" must be an integer ${range}`);
  }
  return value;
};

module.exports = {
  parseIntParam,
};
