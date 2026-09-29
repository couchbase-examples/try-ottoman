const path = require('path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const { HotelRoutes } = require('./hotels/hotels.controller');
const { AirportRoutes } = require('./airports/airports.controller');
const { FlightRoutes } = require('./flights/flights.controller');

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.get('/', (req, res) => {
    res.send('I am ready!!');
  });
  app.use('/hotels', HotelRoutes);
  app.use('/airports', AirportRoutes);
  app.use('/flightPaths', FlightRoutes);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(YAML.load(path.join(__dirname, '..', 'swagger.yaml'))));

  app.use((err, req, res, next) => {
    return res.status(500).json({ message: err.toString() });
  });

  return app;
};

module.exports = { createApp };
