const config = require('./config.js');

module.exports = {
  host: config.DB_HOST,
  database: config.DB_NAME,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  dialect: 'postgres'
};
