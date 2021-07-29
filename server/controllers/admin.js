const { permissions } = require('../utils');

const impersonationTimeoutMap = new Map();

function startImpersonating (user, orgId) {
  return user.update({
    invisible: true,
    orgId
  });
}

function stopImpersonating (user) {
  return user.update({
    invisible: false,
    orgId: user.realOrgId
  });
}

class AdminCtrl {
  static async joinOrgAsInvisibleUser (orgId, user) {
    if (!permissions.isSuperuser(user)) {
      throw new Error('Permission denied!');
    }
    // initialize realOrgId if null (hoping that a null realOrgId means not currently impersonating...)
    if (!user.realOrgId) {
      await user.update({
        realOrgId: user.orgId
      });
    }

    const isImpersonating = user.realOrgId !== user.orgId;
    if (isImpersonating && !user.invisible) {
      console.warn(`User ${user.id} is impersonating ${user.orgId} but not invisible!`);
    }

    if (orgId === user.realOrgId) {
      return stopImpersonating(user);
    }

    const org = await startImpersonating(user, orgId);
    const oldTimeout = impersonationTimeoutMap.get(user.id);
    impersonationTimeoutMap.set(user.id, setTimeout(() => {
      stopImpersonating(user);
    }, 1800000)); // 30 min
    if (oldTimeout) {
      clearTimeout(oldTimeout);
    }
    return org;
  }
}

module.exports = AdminCtrl;
