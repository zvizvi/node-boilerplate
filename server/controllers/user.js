const _ = require('lodash');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const moment = require('moment');

const { permissions, trim } = require('../utils');
const { User, Org, EmailVerificationToken, RestoreToken, Session } = require('../models');
const EmailCtrl = require('./email');

// !TODO: admin should be allowed to update agent related to his org, [need some general permissions refactoring]
class UserCtrl {
  static async create (user) {
    if (!user.email) {
      const error = new Error('User email is required.');
      throw error;
    }

    const userQuery = {
      firstName: trim(user.name),
      lastName: trim(user.lastName),
      email: (trim(user.email) ? trim(user.email).toLowerCase() : null),
      phone: trim(user.phone),
      permission: user.permission === 'admin' ? user.permission : 'agent', // TODO
      orgId: user.orgId || null,
      //! TEMP!!
      emailVerified: true
    };

    if (user.password) {
      userQuery.password = trim(user.password);
    }

    const isThirdPartyRegister = user.googleId;
    if (isThirdPartyRegister) {
      userQuery.emailVerified = true;
      userQuery.googleId = user.googleId;
    }

    const newUser = await User.create(userQuery);

    //! TODO
    // if (!isThirdPartyRegister) {
    //   await this.createEmailVerificationToken(newUser, true);
    // }

    return clearUserPassword(newUser);
  }

  static async createEmailVerificationToken (user, sendEmail) {
    const buf = crypto.randomBytes(40);
    const token = buf.toString('hex');
    const tokenResult = await EmailVerificationToken.create({
      token,
      userId: user.id
    });
    if (sendEmail) {
      // TODO:
      EmailCtrl.sendEmail(user.email, 'Verify your email');
    }
    return tokenResult;
  }

  static async sendVerificationEmail (email) {
    const user = await User.findOne({
      where: {
        email
      },
      include: [
        { model: EmailVerificationToken }
      ],
      attributes: ['id', 'email', 'firstName']
    });

    const { token } = user.email_verification_token || await this.createEmailVerificationToken(user, false);
    if (!user || user.emailVerified || !token) {
      return true; // Silently ignore.
    }

    // TODO:
    EmailCtrl.sendEmail(email, 'Verify your email');
    return true;
  }

  static async verifyEmail (token) {
    if (!token) {
      throw new Error('Token is required');
    }
    const emailVerificationToken = await EmailVerificationToken.findOne({
      where: {
        token
      },
      include: [
        { model: User }
      ]
    });
    if (!emailVerificationToken) {
      throw new Error('Invalid verification token');
    }
    return emailVerificationToken.user.update({
      emailVerified: true
    });
    // TODO: delete token
  }

  static async update (id, userChanges = {}, user) {
    if (id !== user?.id && !permissions.isSuperuser(user)) {
      throw new Error('User id not match!');
    }

    const resUser = await User.findByPk(id);
    if (!resUser) {
      throw new Error('User not found');
    }

    const isPasswordCorrect = this.comparePassword(userChanges.currentPassword || '', resUser.passwordHash);
    if ('password' in userChanges && !isPasswordCorrect) {
      throw new Error('Password is incorrect');
    }

    const changesObject = {};
    const fields = [
      'firstName',
      'lastName',
      'email',
      'password'
    ];

    const isOwnUser = id === user.id;
    const canEditActiveField = permissions.isSuperuser(user) && !isOwnUser;
    if (canEditActiveField) {
      fields.push('active');
    }

    fields.forEach((field) => {
      if (field in userChanges) {
        changesObject[field] = trim(userChanges[field]);
        if (field === 'email') {
          changesObject[field] = changesObject[field].toLowerCase();
        }
      }
    });

    const accountDeactivated = 'active' in changesObject && resUser.active && !changesObject.active;
    const passwordHasChanged = 'password' in changesObject && !this.comparePassword(userChanges.password, resUser.passwordHash);

    if (accountDeactivated || passwordHasChanged) {
      this.deleteSessions(resUser, user);
    }

    const updatedUser = await resUser.update(changesObject);
    return clearUserPassword(updatedUser);
  }

  static async delete (id, user) {
    if (!permissions.isSuperuser(user)) {
      throw new Error('Access denied');
    }

    const userRes = await User.findByPk(id);
    return userRes.update({
      permission: null,
      orgId: null
    });
  }

  static list (user) {
    if (!permissions.isSuperuser(user)) {
      throw new Error('Access denied');
    }

    const query = {
      attributes: {
        exclude: ['passwordHash']
      },
      include: [
        { model: Org }
      ]
    };

    return User.findAll(query);
  }

  static findById (id, user) {
    if (id !== user?.id && !permissions.isSuperuser(user)) {
      throw new Error('User id not match!');
    }
    return User.findOne({
      where: { id },
      include: [
        { model: Org }
      ]
    });
  }

  static comparePassword (password, hash) {
    return bcrypt.compareSync(password, hash);
  }

  static async saveCrmSettings (userId, crmSettings, overwriteExist, user) {
    const resUser = await UserCtrl.findById(userId, user);

    const crmSettingsChangesKeys = Object.keys(crmSettings);
    let crmSettingsChanges = resUser.crmSettings;

    if (!_.isObject(crmSettingsChanges) || overwriteExist) {
      crmSettingsChanges = {};
    }
    crmSettingsChangesKeys.forEach((field) => {
      crmSettingsChanges[field] = trim(crmSettings[field]);
    });

    resUser.crmSettings = crmSettingsChanges;
    return resUser.save();
  }

  static async restorePassword (email) {
    const user = await User.findOne({ where: { email } });
    const userId = user?.id;
    const userEmail = user?.email;

    if (!userId || !userEmail) {
      throw new Error('Email address not found');
    }

    await RestoreToken.destroy({
      where: { userId }
    });

    let createdRestoreToken;
    crypto.randomBytes(40, (ex, buf) => {
      const token = buf.toString('hex');

      createdRestoreToken = RestoreToken.create({
        userId, token
      });
    });

    // TODO:
    // const token = createdRestoreToken.token;
    await EmailCtrl.sendEmail(userEmail, 'Restore');
    return 'success';
  }

  static async newPassword (token, password) {
    if (!token || !password) {
      throw new Error('token or password missing');
    }

    const tokenResult = await RestoreToken.findOne({
      where: { token },
      include: [
        { model: User, require: true }
      ]
    });
    const user = tokenResult?.user;
    if (!user) {
      throw new Error('Token user not found');
    }
    if (moment().isAfter(moment(tokenResult.createdAt).add(24, 'hours'))) {
      throw new Error('Token expired');
    }

    await user.update({ password });
    await RestoreToken.destroy({ where: { token } });
    await this.deleteSessions(user, user);

    return 'success';
  }

  static async checkRestoreToken (token) {
    const tokenResult = await RestoreToken.findOne({
      where: { token },
      include: [
        { model: User, require: true }
      ]
    });
    if (!tokenResult?.user) {
      throw new Error('Token user not found');
    }
    if (moment().isAfter(moment(tokenResult.createdAt).add(24, 'hours'))) {
      throw new Error('Token expired');
    }
    return { msg: 'Token is valid', email: tokenResult.user.email };
  }

  static async deleteSessions (targetUser, user) {
    if (targetUser.orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Delete sessions: Access denied');
    }
    return Session.destroy({
      where: {
        userId: targetUser.id
      }
    });
  }
}

module.exports = UserCtrl;

function clearUserPassword (user) {
  user = user.get({
    plain: true
  });
  user.password = '';
  delete user.passwordHash;
  return user;
}
