const Sequelize = require('sequelize');
const bcrypt = require('bcryptjs');

const sequelizeConnect = require('../db/connect');

const User = sequelizeConnect.define('user', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    primaryKey: true
  },
  number: {
    type: Sequelize.INTEGER,
    autoIncrement: true
  },
  invisible: {
    // hack to allow admin to join an org invisibly.
    // TODO: a better hack... or use a system that's not a hack...
    type: Sequelize.BOOLEAN
  },
  realOrgId: {
    type: Sequelize.UUID
  },
  firstName: {
    type: Sequelize.STRING
  },
  lastName: {
    type: Sequelize.STRING
  },
  phone: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING,
    set (val) {
      this.setDataValue('email', val.toLowerCase());
    },
    allowNull: false,
    validate: {
      isEmail: { msg: 'Invalid email.' }
    },
    unique: {
      name: 'email',
      msg: 'Email is already registered.'
    }
  },
  emailVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  orgId: {
    type: Sequelize.UUID
  },
  googleId: {
    type: Sequelize.STRING
  },
  permission: {
    type: Sequelize.ENUM('superuser', 'admin', 'agent'),
    allowNull: true,
    defaultValue: 'agent'
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
  passwordHash: Sequelize.STRING,
  password: {
    type: Sequelize.VIRTUAL,
    set (val) {
      // Remember to set the data value, otherwise it won't be validated
      this.setDataValue('password', val);
      this.setDataValue('passwordHash', this.generateHash(val));
    },
    validate: {
      notEmpty: true,
      len: {
        args: [4, 50],
        msg: 'Please choose a longer password'
      }
    }
  },
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
  deletedAt: Sequelize.DATE
}, {
  freezeTableName: true,
  indexes: [{ unique: true, fields: ['email'] }],
  paranoid: true
});

User.associate = function (models) {
  User.hasOne(models.EmailVerificationToken, {
    foreignKey: 'userId'
  });
  User.belongsTo(models.Org, {
    foreignKey: 'orgId'
  });
  User.hasMany(models.Session, {
    foreignKey: 'userId'
  });
};

User.prototype.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
};

User.prototype.isSuperuser = function () {
  return this?.permission === 'superuser';
};

User.prototype.isAdmin = function () {
  return ['superuser', 'admin'].includes(this?.permission);
};

User.prototype.isAgent = function () {
  return this?.permission === 'agent';
};

module.exports = User;
