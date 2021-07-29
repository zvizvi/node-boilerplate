const { isNil } = require('lodash');

const { User } = require('../models');
const OrgCtrl = require('./org');
const UserCtrl = require('./user');

class RegisterCtrl {
  static async register (userFields, orgFields, userId) {
    const org = await OrgCtrl.create({ name: 'demo', email: 'demo@mail.com' });
    if (isNil(org) || isNil(org.id)) {
      throw new Error('Some error...');
    }

    if (userId) { // User exists but is not associated to an org
      const user = await User.findOne({
        where: {
          id: userId
        }
      });
      return user.update({ orgId: org.id });
    }

    // complete user fields
    userFields.permission = 'admin';
    userFields.orgId = org.id;
    const user = await UserCtrl.create(userFields);
    user.org = org;
    console.log('New user: ', user);
    return user;
  }

  static async checkRegisteredEmail (email = '') {
    const user = await User.findOne({
      where: { email: email.toLowerCase() }
    });
    return !isNil(user);
  }
}

module.exports = RegisterCtrl;
