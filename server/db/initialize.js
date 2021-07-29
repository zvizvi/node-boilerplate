const sequelizeConnect = require('./connect');

const { Org, User } = require('../models');

const sync = {
  async initAll () {
    await sequelizeConnect.sync({ force: true });
    const org = await Org.create({
      name: 'My Organization'
    });
    const user = await User.create({
      firstName: 'משה',
      lastName: 'כהן',
      orgId: org.id,
      email: 'admin@gmail.com',
      password: '12345678',
      permission: 'superuser'
    });

    console.log('done.\nUser created:');
    console.log(user.get({ plain: true }));
    process.exit(0);
  },
  destroyTables () {

  }
};

module.exports = sync;
