const express = require('express');
const { HotelModel } = require('./hotels.model');
const { makeResponse } = require('../shared/make.response');
const { parseIntParam } = require('../shared/query-params');
const { FindOptions } = require('ottoman');
const router = express();

router.get('/', async (req, res) => {
  await makeResponse(res, async () => {
    const options = new FindOptions({
      limit: parseIntParam(req.query, 'limit', 50, { min: 1 }),
      skip: parseIntParam(req.query, 'skip', 0),
      // A stable order keeps limit/skip pages from overlapping.
      sort: { name: 'ASC', id: 'ASC' },
    });
    const filter = req.query.search ? { name: { $like: `%${req.query.search}%` } } : {};
    const result = await HotelModel.find(filter, options);
    const { rows: items } = result;
    return {
      items,
    };
  });
});

router.get('/:id', async (req, res) => {
  await makeResponse(res, () => HotelModel.findById(req.params.id));
});

router.post('/', async (req, res) => {
  await makeResponse(res, () => {
    res.status(201);
    const hotel = new HotelModel(req.body);
    return hotel.save();
  });
});

router.patch('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    res.status(204);
    await HotelModel.updateById(req.params.id, req.body);
  });
});

router.put('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    await HotelModel.replaceById(req.params.id, req.body);
    res.status(204);
  });
});

router.delete('/:id', async (req, res) => {
  await makeResponse(res, async () => {
    // Load the hotel first: removeById only knows the id, so Ottoman can't find the
    // findRefName refdoc entry to clean up and it's left behind.
    const hotel = await HotelModel.findById(req.params.id);
    await hotel.remove();
    res.status(204);
  });
});

module.exports = {
  HotelRoutes: router
}
