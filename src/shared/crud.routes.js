const { makeResponse } = require('./make.response');

/**
 * Adds the read/create/patch/replace/delete endpoints every resource shares to `router`:
 *
 *   GET /:id     → 200 with the document
 *   POST /       → 201 with the saved document
 *   PATCH /:id   → 204, merges the body into the document
 *   PUT /:id     → 204, replaces the whole document with the body
 *   DELETE /:id  → 204
 *
 * Errors map to 400/404/500 through `makeResponse`. Add list routes (`GET /`) before calling this.
 * @param router an Express router
 * @param Model an Ottoman model
 */
const addCrudRoutes = (router, Model) => {
  router.get('/:id', async (req, res) => {
    await makeResponse(res, () => Model.findById(req.params.id));
  });

  router.post('/', async (req, res) => {
    await makeResponse(res, async () => {
      const saved = await new Model(req.body).save();
      res.status(201);
      return saved;
    });
  });

  router.patch('/:id', async (req, res) => {
    await makeResponse(res, async () => {
      await Model.updateById(req.params.id, req.body);
      res.status(204);
    });
  });

  router.put('/:id', async (req, res) => {
    await makeResponse(res, async () => {
      await Model.replaceById(req.params.id, req.body);
      res.status(204);
    });
  });

  router.delete('/:id', async (req, res) => {
    await makeResponse(res, async () => {
      // Load the document first: removeById only knows the id, so Ottoman can't find a
      // refdoc index entry (like the hotel model's findRefName) to clean up and it's left behind.
      const doc = await Model.findById(req.params.id);
      await doc.remove();
      res.status(204);
    });
  });

  return router;
};

module.exports = {
  addCrudRoutes,
};
