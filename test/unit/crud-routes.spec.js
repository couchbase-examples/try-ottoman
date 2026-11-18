const express = require('express');
const supertest = require('supertest');
const { ValidationError } = require('ottoman');
const { addCrudRoutes } = require('../../src/shared/crud.routes');

const notFound = (id) => Promise.reject(new Error(`document not found: ${id}`));

/** An in-memory stand-in for an Ottoman model, exposing just what the CRUD routes use. */
const fakeModel = () => {
  const docs = new Map();
  const removed = [];

  class FakeModel {
    constructor(data) {
      Object.assign(this, data);
    }

    async save() {
      if (!this.name) {
        throw new ValidationError("Property 'name' is required");
      }
      this.id = this.id || `doc_${docs.size + 1}`;
      docs.set(this.id, { ...this });
      return this;
    }

    // Instance removal, so the routes can clean up index entries that need the loaded document.
    async remove() {
      removed.push(this.id);
      docs.delete(this.id);
    }

    static async findById(id) {
      return docs.has(id) ? new FakeModel(docs.get(id)) : notFound(id);
    }

    static async updateById(id, data) {
      return docs.has(id) ? docs.set(id, { ...docs.get(id), ...data }) : notFound(id);
    }

    static async replaceById(id, data) {
      return docs.has(id) ? docs.set(id, { ...data, id }) : notFound(id);
    }

    static async removeById() {
      throw new Error('removeById skips refdoc cleanup; the routes should remove a loaded document instead');
    }
  }

  return { Model: FakeModel, docs, removed };
};

describe('addCrudRoutes', () => {
  let api;
  let store;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    store = fakeModel();
    const app = express();
    app.use(express.json());
    app.use('/things', addCrudRoutes(express.Router(), store.Model));
    api = supertest(app);
  });

  it('creates, reads, patches, replaces and deletes a document', async () => {
    const createRes = await api.post('/things').send({ name: 'a', color: 'red' }).expect(201);
    const { id } = createRes.body;
    expect(createRes.body).toMatchObject({ id, name: 'a', color: 'red' });

    await api.get(`/things/${id}`).expect(200, { id, name: 'a', color: 'red' });

    await api.patch(`/things/${id}`).send({ color: 'blue' }).expect(204);
    expect(store.docs.get(id)).toEqual({ id, name: 'a', color: 'blue' });

    await api.put(`/things/${id}`).send({ name: 'b' }).expect(204);
    expect(store.docs.get(id)).toEqual({ id, name: 'b' });

    await api.delete(`/things/${id}`).expect(204);
    expect(store.removed).toEqual([id]);
    await api.get(`/things/${id}`).expect(404);
  });

  it('responds 400 when the model rejects a new document', async () => {
    const res = await api.post('/things').send({ color: 'red' }).expect(400);
    expect(res.body.message).toMatch(/name/);
  });

  it.each([
    ['get', '/things/missing'],
    ['patch', '/things/missing'],
    ['put', '/things/missing'],
    ['delete', '/things/missing'],
  ])('responds 404 to %s on an unknown id', async (method, path) => {
    const res = await api[method](path).send({ name: 'x' }).expect(404);
    expect(res.body.message).toMatch(/not found/);
  });
});
