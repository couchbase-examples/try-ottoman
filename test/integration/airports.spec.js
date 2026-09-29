const { AirportModel } = require('../../src/airports/airports.model');
const { describeCrud, setupApi } = require('../helpers');

const api = setupApi();

const newAirport = () => ({
  airportname: 'Test Intl',
  city: 'Testville',
  country: 'United States',
  faa: 'TST',
  icao: 'KTST',
  tz: 'America/Los_Angeles',
  geo: { lat: 37.6, lon: -122.4, alt: 13 },
});

describe('/airports', () => {
  describe('GET /airports', () => {
    it('finds travel-sample airports by name', async () => {
      const res = await api.get('/airports').query({ search: 'San Francisco' }).expect(200);
      expect(res.body.items).toContainEqual(expect.objectContaining({ airportname: 'San Francisco Intl', faa: 'SFO' }));
    });

    it('honors limit', async () => {
      const res = await api.get('/airports').query({ limit: 3 }).expect(200);
      expect(res.body.items).toHaveLength(3);
    });

    it('orders airports by name and honors skip', async () => {
      const all = await api.get('/airports').query({ search: 'Intl', limit: 4 }).expect(200);
      const skipped = await api.get('/airports').query({ search: 'Intl', limit: 3, skip: 1 }).expect(200);
      const names = all.body.items.map((a) => a.airportname);
      expect(names).toHaveLength(4);
      expect(names).toEqual([...names].sort());
      expect(skipped.body.items.map((a) => a.id)).toEqual(all.body.items.slice(1).map((a) => a.id));
    });

    it('responds 400 for an invalid limit', async () => {
      const res = await api.get('/airports').query({ limit: 'lots' }).expect(400);
      expect(res.body.message).toMatch(/"limit"/);
    });
  });

  describe('GET /airports/:id', () => {
    it('reads a travel-sample airport', async () => {
      const res = await api.get('/airports/airport_3469').expect(200);
      expect(res.body).toMatchObject({ id: 3469, airportname: 'San Francisco Intl', faa: 'SFO' });
    });
  });

  describe('POST /airports validation', () => {
    it('responds 400 when a required field is missing', async () => {
      const { tz, ...airport } = newAirport();
      const res = await api.post('/airports').send(airport).expect(400);
      expect(res.body.message).toMatch(/tz/);
    });

    it('responds 400 when geo is missing lat/lon', async () => {
      await api.post('/airports').send({ ...newAirport(), geo: { alt: 1 } }).expect(400);
    });
  });

  describeCrud(api, '/airports', AirportModel, {
    create: newAirport,
    patch: { airportname: 'Patched Intl' },
    replace: () => ({
      airportname: 'Replaced Intl',
      city: 'Newtown',
      country: 'France',
      tz: 'Europe/Paris',
    }),
  });
});
