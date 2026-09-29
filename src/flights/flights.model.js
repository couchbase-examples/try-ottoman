const { Schema, model } = require('ottoman');
// Models register on the default Ottoman instance, so make sure it exists first.
require('../../ottoman-global-config');

const FlightSchema = new Schema({
  day: Number,
  flight: String,
  utc: String,
});

const RouteSchema = new Schema({
  airline: String,
  airlineid: String,
  destinationairport: String,
  distance: Number,
  equipment: String,
  id: String,
  schedule: [FlightSchema],
  sourceairport: String,
  stops: Number,
  type: String,
});

const RouteModel = model('route', RouteSchema);

module.exports = {
  RouteModel
}
