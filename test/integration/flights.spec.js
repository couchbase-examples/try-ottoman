const { RouteModel } = require('../../src/flights/flights.model');
const { describeCrud, setupApi } = require('../helpers');

const api = setupApi();

// San Francisco Intl (SFO) → Los Angeles Intl (LAX) in travel-sample.
const SFO = 'airport_3469';
const LAX = 'airport_3484';

const newRoute = () => ({
  airline: 'TT',
  airlineid: 'airline_137',
  sourceairport: 'SFO',
  destinationairport: 'LAX',
  distance: 543.2,
  equipment: '737',
  stops: 0,
  schedule: [
    { day: 1, flight: 'TT100', utc: '08:00:00' },
    { day: 3, flight: 'TT101', utc: '17:30:00' },
  ],
});

describe('/flightPaths', () => {
  describe('GET /flightPaths', () => {
    it('finds flights between two airports on a given weekday, ordered by airline', async () => {
      const res = await api.get('/flightPaths').query({ from: SFO, to: LAX, weekDay: 1 }).expect(200);
      const { items } = res.body;
      expect(items.length).toBeGreaterThan(0);
      items.forEach((item) => {
        expect(item).toMatchObject({ sourceairport: 'SFO', destinationairport: 'LAX', day: 1 });
        expect(item).toEqual(expect.objectContaining({ name: expect.any(String), flight: expect.any(String) }));
      });
      const names = items.map((item) => item.name);
      expect(names).toEqual([...names].sort());
    });

    it('honors limit', async () => {
      const res = await api.get('/flightPaths').query({ from: SFO, to: LAX, weekDay: 1, limit: 2 }).expect(200);
      expect(res.body.items).toHaveLength(2);
    });

    it('honors skip', async () => {
      const all = await api.get('/flightPaths').query({ from: SFO, to: LAX, weekDay: 1, limit: 4 }).expect(200);
      const skipped = await api
        .get('/flightPaths')
        .query({ from: SFO, to: LAX, weekDay: 1, limit: 3, skip: 1 })
        .expect(200);
      expect(all.body.items).toHaveLength(4);
      expect(skipped.body.items).toEqual(all.body.items.slice(1));
    });

    it('returns flights on every weekday when weekDay is omitted', async () => {
      const res = await api.get('/flightPaths').query({ from: SFO, to: LAX, limit: 500 }).expect(200);
      expect(new Set(res.body.items.map((item) => item.day)).size).toBeGreaterThan(1);
    });

    it.each(['7', '-1', 'monday'])('responds 400 for weekDay=%s', async (weekDay) => {
      const res = await api.get('/flightPaths').query({ from: SFO, to: LAX, weekDay }).expect(400);
      expect(res.body.message).toMatch(/"weekDay"/);
    });

    it('responds 400 when from or to is missing', async () => {
      await api.get('/flightPaths').query({ from: SFO }).expect(400);
    });

    it('responds 404 for an unknown airport', async () => {
      await api.get('/flightPaths').query({ from: SFO, to: 'airport_does_not_exist' }).expect(404);
    });
  });

  describe('GET /flightPaths/:id', () => {
    it('reads a travel-sample route', async () => {
      const res = await api.get('/flightPaths/route_11981').expect(200);
      expect(res.body).toMatchObject({ id: 11981, sourceairport: 'SFO', destinationairport: 'LAX' });
    });
  });

  describeCrud(api, '/flightPaths', RouteModel, {
    create: newRoute,
    patch: { equipment: '320' },
    replace: () => ({
      airline: 'TT',
      airlineid: 'airline_137',
      sourceairport: 'LAX',
      destinationairport: 'SFO',
      schedule: [{ day: 5, flight: 'TT200', utc: '12:00:00' }],
    }),
  });
});
