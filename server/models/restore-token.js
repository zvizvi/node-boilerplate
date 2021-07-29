const Sequelize = require('sequelize');

const sequelizeConnect = require('../db/connect');

const RestoreToken = sequelizeConnect.define('restore_token', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  token: {
    type: Sequelize.STRING,
    unique: {
      name: 'token',
      msg: 'Token is already exist.'
    }
  },
  userId: {
    type: Sequelize.UUID
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  freezeTableName: true
});

RestoreToken.associate = function (models) {
  RestoreToken.belongsTo(models.User, {
    foreignKey: 'userId'
  });
};

module.exports = RestoreToken;
