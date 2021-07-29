const Sequelize = require('sequelize');

const sequelizeConnect = require('../db/connect');

const EmailVerificationToken = sequelizeConnect.define('email_verification_token', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  userId: {
    type: Sequelize.UUID,
    unique: true
  },
  token: {
    type: Sequelize.STRING
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE
}, {
  freezeTableName: true
});

EmailVerificationToken.associate = function (models) {
  EmailVerificationToken.belongsTo(models.User, {
    foreignKey: 'userId'
  });
};

module.exports = EmailVerificationToken;
