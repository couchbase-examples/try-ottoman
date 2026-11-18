const express = require('express');
const { HotelModel } = require('./hotels.model');
const { makeResponse } = require('../shared/make.response');
const { parseIntParam } = require('../shared/query-params');
const { addCrudRoutes } = require('../shared/crud.routes');
const { FindOptions } = require('ottoman');
const router = express.Router();

router.get('/', async (req, res) => {
  await makeResponse(res, async () => {
    const options = new FindOptions({
      limit: parseIntParam(req.query, 'limit', 50, { min: 1 }),
      skip: parseIntParam(req.query, 'skip', 0),
      // A stable order keeps limit/skip pages from overlapping.
      sort: { name: 'ASC', id: 'ASC' },
    });
    // $ignoreCase only lowercases the name match, so the rest of the query can still use indexes.
    const filter = req.query.search ? { name: { $like: `%${req.query.search}%`, $ignoreCase: true } } : {};
    const result = await HotelModel.find(filter, options);
    const { rows: items } = result;
    return {
      items,
    };
  });
});

addCrudRoutes(router, HotelModel);

module.exports = {
  HotelRoutes: router
}
