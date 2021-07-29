const Sequelize = require('sequelize');

const sequelizeConnect = require('../db/connect');

const Session = sequelizeConnect.define('Session', {
  sid: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  data: {
    type: Sequelize.TEXT
  },
  userId: {
    type: Sequelize.UUID
  },
  expires: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true
});

module.exports = Session;
