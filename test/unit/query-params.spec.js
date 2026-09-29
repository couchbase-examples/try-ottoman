const { ValidationError } = require('ottoman');
const { parseIntParam } = require('../../src/shared/query-params');

describe('parseIntParam', () => {
  it.each([undefined, ''])('returns the default for %p', (value) => {
    expect(parseIntParam({ limit: value }, 'limit', 50)).toBe(50);
  });

  it('parses an integer', () => {
    expect(parseIntParam({ limit: '10' }, 'limit', 50)).toBe(10);
  });

  it.each(['abc', '1.5', '-1'])('rejects %p', (value) => {
    expect(() => parseIntParam({ limit: value }, 'limit', 50)).toThrow(ValidationError);
    expect(() => parseIntParam({ limit: value }, 'limit', 50)).toThrow('Query param "limit" must be an integer >= 0');
  });

  it('enforces the range', () => {
    expect(parseIntParam({ day: '6' }, 'day', undefined, { min: 0, max: 6 })).toBe(6);
    expect(() => parseIntParam({ day: '7' }, 'day', undefined, { min: 0, max: 6 })).toThrow(
      'Query param "day" must be an integer between 0 and 6',
    );
  });
});
