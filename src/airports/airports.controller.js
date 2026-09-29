const express = require('express');
const { AirportModel } = require('./airports.model');
const { makeResponse } = require('../shared/make.response');
const { parseIntParam } = require('../shared/query-params');
const { FindOptions } = require('ottoman');

const router = express();

router.get('/', async (req, res) => {
  await makeResponse(res, async () => {
    const { search } = req.query;
    const options = new FindOptions({
      limit: parseIntParam(req.query, 'limit', 50, { min: 1 }),
      skip: parseIntParam(req.query, 'skip', 0),
      // A stable order keeps limit/skip pages from overlapping.
      sort: { airportname: 'ASC', id: 'ASC' },
    });
    const filter = search ? { airportname: { $like: `%${search}%` } } : {};
    const result = await AirportModel.find(filter, options);
    const { rows: items } = result;
    return {
      items,
    };
  });
});

router.get('/:id', async (req, res) => {
  await makeResponse(res, () => AirportModel.findById(req.params.id));
});

router.post('/', async (req, res) => {
  await makeResponse(res, () => {
    res.status(201);
    const airport = new AirportModel(req.body);
    return airport.save();
  });
});

router.patch('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    res.status(204);
    await AirportModel.updateById(req.params.id, req.body);
  });
});

router.put('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    await AirportModel.replaceById(req.params.id, req.body);
    res.status(204);
  });
});

router.delete('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    await AirportModel.removeById(req.params.id);
    res.status(204);
  });
});

module.exports = {
  AirportRoutes: router
}