const { HotelModel } = require('../../src/hotels/hotels.model');
const { ottoman } = require('../../src/db');
const { describeCrud, setupApi, uniqueSuffix } = require('../helpers');

const api = setupApi();

const newHotel = () => ({
  name: `Test Hotel ${uniqueSuffix()}`,
  address: '1 Test Street',
  city: 'Testville',
  country: 'United States',
  phone: '(555) 555-1234',
  url: 'https://example.com',
  free_breakfast: true,
});

// The lookup document Ottoman keeps for the findRefName refdoc index.
const refdocExists = async (name) => {
  const { exists } = await ottoman.getCollection('hotel', 'inventory').exists(`$inventoryhotel$name.${name}`);
  return exists;
};

describe('/hotels', () => {
  describe('GET /hotels', () => {
    it('finds travel-sample hotels by name', async () => {
      const res = await api.get('/hotels').query({ search: 'Medway' }).expect(200);
      expect(res.body.items).toEqual([expect.objectContaining({ name: 'Medway Youth Hostel' })]);
    });

    it('matches the name case-insensitively', async () => {
      const res = await api.get('/hotels').query({ search: 'mEDWAY' }).expect(200);
      expect(res.body.items).toEqual([expect.objectContaining({ name: 'Medway Youth Hostel' })]);
    });

    it('honors limit', async () => {
      const res = await api.get('/hotels').query({ limit: 5 }).expect(200);
      expect(res.body.items).toHaveLength(5);
    });

    it('orders hotels by name', async () => {
      const res = await api.get('/hotels').query({ search: 'Inn', limit: 20 }).expect(200);
      const names = res.body.items.map((h) => h.name);
      expect(names).toHaveLength(20);
      expect(names).toEqual([...names].sort());
    });

    it('honors skip', async () => {
      const all = await api.get('/hotels').query({ search: 'Inn', limit: 4 }).expect(200);
      const skipped = await api.get('/hotels').query({ search: 'Inn', limit: 3, skip: 1 }).expect(200);
      expect(all.body.items).toHaveLength(4);
      expect(skipped.body.items.map((h) => h.id)).toEqual(all.body.items.slice(1).map((h) => h.id));
    });

    it.each([
      [{ limit: 'abc' }, /"limit"/],
      [{ limit: 0 }, /"limit"/],
      [{ skip: -1 }, /"skip"/],
    ])('responds 400 for %p', async (query, message) => {
      const res = await api.get('/hotels').query(query).expect(400);
      expect(res.body.message).toMatch(message);
    });
  });

  describe('GET /hotels/:id', () => {
    it('reads a travel-sample hotel', async () => {
      const res = await api.get('/hotels/hotel_10025').expect(200);
      expect(res.body).toMatchObject({ id: 10025, name: 'Medway Youth Hostel' });
    });
  });

  describe('POST /hotels validation', () => {
    it('responds 400 when a required field is missing', async () => {
      const { name, ...hotel } = newHotel();
      const res = await api.post('/hotels').send(hotel).expect(400);
      expect(res.body.message).toMatch(/name/);
    });

    it('responds 400 for an invalid phone number', async () => {
      const res = await api.post('/hotels').send({ ...newHotel(), phone: 'call me maybe' }).expect(400);
      expect(res.body.message).toBe('Phone number is invalid.');
    });

    it('responds 400 for an invalid url', async () => {
      await api.post('/hotels').send({ ...newHotel(), url: 'not a link' }).expect(400);
    });
  });

  describe('findRefName refdoc index', () => {
    let id;

    afterAll(async () => {
      if (id) {
        await HotelModel.findById(id).then((doc) => doc.remove()).catch(() => undefined);
      }
    });

    it('keeps the refdoc entry in step with the hotel through replace and delete', async () => {
      const original = newHotel();
      ({ id } = (await api.post('/hotels').send(original).expect(201)).body);
      expect(await refdocExists(original.name)).toBe(true);

      const replacement = newHotel();
      await api.put(`/hotels/${id}`).send(replacement).expect(204);
      expect(await refdocExists(original.name)).toBe(false);
      expect(await refdocExists(replacement.name)).toBe(true);

      await api.delete(`/hotels/${id}`).expect(204);
      expect(await refdocExists(replacement.name)).toBe(false);
    });
  });

  describeCrud(api, '/hotels', HotelModel, {
    create: newHotel,
    patch: { vacancy: true, price: 99 },
    replace: () => ({
      name: `Test Hotel replaced ${uniqueSuffix()}`,
      address: '2 Replacement Road',
      city: 'Newtown',
      country: 'France',
    }),
  });
});
