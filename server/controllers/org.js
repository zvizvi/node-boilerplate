const { isString } = require('lodash');

const { permissions, trim } = require('../utils');
const { Org, User } = require('../models');

const settingsFields = [
  //
];

const orgFields = [
  'name',
  'email'
];

class OrgCtrl {
  static async create (org, logo) {
    const orgNewObject = {};
    orgFields.forEach((field) => {
      orgNewObject[field] = trim(org[field]);
    });
    if (isString(org.email)) {
      orgNewObject.email = org.email.toLowerCase();
    }
    const newOrg = await Org.create(orgNewObject);
    return newOrg;
  }

  static async list (user, queryParams = {}) {
    if (!permissions.isSuperuser(user)) {
      throw new Error('Permission denied');
    }
    const query = {
      include: [
        {
          model: User,
          required: true,
          where: {
            emailVerified: true
          },
          attributes: {
            exclude: ['passwordHash']
          }
        }
      ],
      limit: queryParams.limit || 100,
      offset: queryParams.offset || 0
    };

    if (queryParams.order) {
      const sort = queryParams.desc ? 'DESC' : 'ASC';
      if (queryParams.order in Org.rawAttributes) {
        query.order = [
          [queryParams.order, sort],
          ['createdAt', 'ASC']
        ];
      }

      if (queryParams.order === 'org.name') {
        query.order = [
          [Org, 'name', sort],
          ['createdAt', 'ASC']
        ];
      }
    }

    const [count, rows] = await Promise.all([
      Org.count({
        ...query,
        distinct: true,
        col: 'id'
      }),
      Org.findAll(query)
    ]);

    return { count, rows };
  }

  static async findById (orgId, user) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Org id not match!');
    }
    const query = {
      where: { id: orgId }
    };
    let org;
    try {
      org = await Org.findOne(query);
    } catch (err) {
      console.error(err);
      // TODO: switch message based on error type, implement similar logic in all requests...
      throw new Error('Bad request');
    }
    if (!org) {
      throw new Error('Org not found');
    }
    return org;
  }

  static async update (orgId, orgObject, user) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Permission denied!');
    }

    const changes = {};

    const isOwnOrg = orgId === user.orgId;
    const canEditActiveField = permissions.isSuperuser(user) && !isOwnOrg;
    if (canEditActiveField) {
      orgFields.push('active');
    }

    orgFields.forEach((field) => {
      if (field in orgObject) {
        changes[field] = trim(orgObject[field]);
      }
    });

    if (isString(orgObject.email)) {
      changes.email = orgObject.email.toLowerCase();
    }

    const org = await OrgCtrl.findById(orgId, user);

    return org.update(changes);
  }

  static async saveSettings (orgId, settings, user) {
    const org = await OrgCtrl.findById(orgId, user);
    Object.keys(settings).forEach((field) => {
      if (settingsFields.includes(field)) {
        org.set('settings.' + field, trim(settings[field]));
      }
      if (field === 'emailTemplate') {
        org.set('emailTemplate', settings[field]);
      }
    });

    return org.save();
  }

  static async saveCrmSettings (orgId, crmSettings, user) {
    const org = await OrgCtrl.findById(orgId, user);
    Object.keys(crmSettings).forEach((field) => {
      org.set('crmSettings.' + field, trim(crmSettings[field]));
    });

    return org.save();
  }
}

module.exports = OrgCtrl;
