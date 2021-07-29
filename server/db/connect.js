const Sequelize = require('sequelize');

const config = require('../config/config');

const options = {
  host: config.DB_HOST,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 30,
    min: 0,
    idle: 10000
  }
};

Sequelize.postgres.DECIMAL.parse = function (value) { return parseFloat(value); };

const sequelizeConnect = new Sequelize(config.DB_NAME, config.DB_USERNAME, config.DB_PASSWORD, options);

sequelizeConnect.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelizeConnect;
