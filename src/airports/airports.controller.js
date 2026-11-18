const express = require('express');
const { AirportModel } = require('./airports.model');
const { makeResponse } = require('../shared/make.response');
const { parseIntParam } = require('../shared/query-params');
const { addCrudRoutes } = require('../shared/crud.routes');
const { FindOptions } = require('ottoman');

const router = express.Router();

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

addCrudRoutes(router, AirportModel);

module.exports = {
  AirportRoutes: router
}
