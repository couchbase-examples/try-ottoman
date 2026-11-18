const express = require('express');
const { RouteModel } = require('./flights.model');
const { AirportModel } = require('../airports/airports.model');
const { makeResponse } = require('../shared/make.response');
const { parseIntParam } = require('../shared/query-params');
const { addCrudRoutes } = require('../shared/crud.routes');
const { Query, getDefaultInstance, ValidationError } = require('ottoman');
const router = express.Router();

router.get('/', async (req, res) => {
  await makeResponse(res, async () => {
    const { from, to } = req.query;
    if (!from || !to) {
      throw new ValidationError('Query params "from" and "to" are required');
    }
    const limit = parseIntParam(req.query, 'limit', 50, { min: 1 });
    const skip = parseIntParam(req.query, 'skip', 0);
    const weekDay = parseIntParam(req.query, 'weekDay', undefined, { min: 0, max: 6 });
    const fromDocument = await AirportModel.findById(String(from), { select: 'faa' });
    const toDocument = await AirportModel.findById(String(to), { select: 'faa' });
    const conn = getDefaultInstance();
    const keyspace = `\`${conn.bucketName}\`.\`${conn.config.scopeName}\``;
    const where = { 'r.sourceairport': fromDocument.faa, 'r.destinationairport': toDocument.faa };
    if (weekDay !== undefined) {
      where['s.day'] = weekDay;
    }
    const query = new Query({}, `${keyspace}.route as r UNNEST r.schedule as s`)
      .select('a.name, s.flight, s.utc, s.day, r.sourceairport, r.destinationairport, r.equipment')
      .plainJoin(`JOIN ${keyspace}.airline as a ON KEYS r.airlineid`)
      .where(where)
      .limit(limit)
      .offset(skip)
      .orderBy({ 'a.name': 'ASC', 's.flight': 'ASC' });
    const result = await conn.query(query.build());
    const { rows: items } = result;
    return {
      items,
    };
  });
});

addCrudRoutes(router, RouteModel);

module.exports = {
  FlightRoutes: router
}
