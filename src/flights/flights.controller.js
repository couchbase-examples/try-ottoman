const express = require('express');
const { RouteModel } = require('./flights.model');
const { AirportModel } = require('../airports/airports.model');
const { makeResponse } = require('../shared/make.response');
const { Query, getDefaultInstance, ValidationError } = require('ottoman');
const router = express();

router.get('/', async (req, res) => {
  await makeResponse(res, async () => {
    const { limit, skip, from, to, weekDay } = req.query;
    if (!from || !to) {
      throw new ValidationError('Query params "from" and "to" are required');
    }
    const fromDocument = await AirportModel.findById(String(from), { select: 'faa' });
    const toDocument = await AirportModel.findById(String(to), { select: 'faa' });
    const conn = getDefaultInstance();
    const keyspace = `\`${conn.bucketName}\`.inventory`;
    const where = { 'r.sourceairport': fromDocument.faa, 'r.destinationairport': toDocument.faa };
    if (weekDay !== undefined) {
      where['s.day'] = Number(weekDay);
    }
    const query = new Query({}, `${keyspace}.route as r UNNEST r.schedule as s`)
      .select('a.name, s.flight, s.utc, s.day, r.sourceairport, r.destinationairport, r.equipment')
      .plainJoin(`JOIN ${keyspace}.airline as a ON KEYS r.airlineid`)
      .where(where)
      .limit(Number(limit || 50))
      .offset(Number(skip || 0))
      .orderBy({ 'a.name': 'ASC' });
    const result = await conn.query(query.build());
    const { rows: items } = result;
    return {
      items,
    };
  });
});

router.get('/:id', async (req, res) => {
  await makeResponse(res, () => RouteModel.findById(req.params.id));
});

router.post('/', async (req, res) => {
  await makeResponse(res, () => {
    res.status(201);
    const route = new RouteModel(req.body);
    return route.save();
  });
});

router.patch('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    res.status(204);
    await RouteModel.updateById(req.params.id, req.body);
  });
});

router.put('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    await RouteModel.replaceById(req.params.id, req.body);
    res.status(204);
  });
});

router.delete('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    await RouteModel.removeById(req.params.id);
    res.status(204);
  });
});

module.exports = {
  FlightRoutes: router
}
