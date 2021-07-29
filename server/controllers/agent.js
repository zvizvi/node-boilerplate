const Sequelize = require('sequelize');
const { Op } = Sequelize;

const { trim, permissions } = require('../utils');
const { User } = require('../models');
const UserCtrl = require('./user');

const agentFields = [
  'firstName',
  'lastName',
  'email',
  'active',
  'phone',
  'password'
];

class AgentCtrl {
  static async create (orgId, agent, user) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Org id not match!');
    }
    if (!agent.email) {
      const error = new Error('Agent email is required.');
      throw error;
    }

    agent.email = agent.email.toLowerCase();

    const userExistByEmail = await User.findOne({ where: { email: agent.email } });
    if (userExistByEmail) {
      if (user.orgId) {
        throw new Error('User is already part of another org');
      } else {
        userExistByEmail.update({
          permission: agent?.permission || 'agent',
          orgId
        });
      }
    } else {
      // create new user
      const values = {};

      agentFields.forEach((field) => {
        if (agent[field]) {
          values[field] = trim(agent[field]);
        }
      });

      values.permission = agent?.permission || 'agent';
      values.orgId = orgId;

      const createdAgent = await User.create(values);
      return clearAgentPassword(createdAgent);
    }
  }

  static async findById (agentId, orgId, user) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Org id not match!');
    }

    const userQuery = {
      where: {
        orgId,
        id: agentId,
        invisible: {
          [Op.or]: [false, { [Op.is]: null }]
        }
      }
    };
    if (permissions.isAdmin(user)) {
      userQuery.attributes = {
        exclude: ['passwordHash']
      };
    } else {
      userQuery.where.active = true;
      userQuery.attributes = ['id', 'firstName', 'lastName', 'active'];
    }

    return User.findOne(userQuery);
  }

  static async list (orgId, user, queryParams = {}) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Org id not match!');
    }

    const userQuery = {
      where: {
        orgId,
        invisible: {
          [Op.or]: [false, { [Op.is]: null }]
        }
      },
      limit: queryParams.limit || 100,
      offset: queryParams.offset || 0
    };

    if (permissions.isAdmin(user)) {
      userQuery.attributes = {
        exclude: ['passwordHash'],
        include: [[Sequelize.fn('CONCAT', Sequelize.col('firstName'), ' ', Sequelize.col('lastName')), 'fullName']]
      };
    } else {
      userQuery.attributes = ['id', [Sequelize.fn('CONCAT', Sequelize.col('firstName'), ' ', Sequelize.col('lastName')), 'fullName'], 'active'];
    }

    if (queryParams.order) {
      const sort = queryParams.desc ? 'DESC' : 'ASC';
      if (queryParams.order in User.rawAttributes) {
        userQuery.order = [
          [queryParams.order, sort],
          ['createdAt', 'ASC']
        ];
      }

      if (queryParams.order === 'fullName') {
        userQuery.order = [
          ['firstName', sort],
          ['lastName', sort],
          ['createdAt', 'ASC']
        ];
      }
    }

    const [count, rows] = await Promise.all([
      User.count({
        where: userQuery.where
      }),
      User.findAll(userQuery)
    ]);
    return { count, rows };
  }

  static async update (id, agent, orgId, user) {
    const agentChanges = {};

    const resUser = await this.findById(id, orgId, user);
    agentFields.forEach((field) => {
      if (field in agent) {
        agentChanges[field] = trim(agent[field]);
      }
    });
    if ('permission' in agent) {
      agentChanges.permission = (agent.permission === 'admin' ? agent.permission : 'agent');
    }

    const updatedAgent = await resUser.update(agentChanges);
    return clearAgentPassword(updatedAgent);
  }

  static async exitAgent (agentId, orgId, user) {
    if (orgId !== user.orgId && !permissions.isSuperuser(user)) {
      throw new Error('Org id not match!');
    }

    const agent = await User.findByPk(agentId);

    if (!agent || (agent.orgId !== user.orgId && !permissions.isSuperuser(user))) {
      throw new Error('Agent not found');
    }
    return UserCtrl.deleteSessions(agent, user);
  }
}

module.exports = AgentCtrl;

function clearAgentPassword (agent) {
  agent = agent.get({
    plain: true
  });
  delete agent.passwordHash;
  return agent;
}
