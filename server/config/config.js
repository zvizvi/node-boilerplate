const path = require('path');
const dotenv = require('dotenv');

const dotenvConfig = dotenv.config({ path: path.join(__dirname, '.env') });

if (dotenvConfig.error) {
  console.error('ERROR! couldn\'t load .env file \n', dotenvConfig.error);
}

const config = {
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DIALECT: 'postgres'
};

console.log({
  DB_HOST: config.DB_HOST,
  DB_NAME: config.DB_NAME,
  DB_USERNAME: config.DB_USERNAME
});

module.exports = config;
