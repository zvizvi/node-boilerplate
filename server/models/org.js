const Sequelize = require('sequelize');

const sequelizeConnect = require('../db/connect');

const Org = sequelizeConnect.define('org', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    set (val) {
      this.setDataValue('email', (val || '').toLowerCase());
    }
  },
  active: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: Sequelize.JSONB,
    defaultValue: {}
  },
  crmSettings: {
    type: Sequelize.JSONB,
    defaultValue: {}
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
  deletedAt: Sequelize.DATE
}, {
  freezeTableName: true,
  paranoid: true
});

Org.associate = function (models) {
  Org.hasMany(models.User, {
    foreignKey: 'orgId'
  });
};

module.exports = Org;
