const moment = require('moment');

const permissions = {
  isAuthenticated (req) {
    return req.isAuthenticated();
  },
  isAccountNotEnded (req) {
    const { user } = req;
    const now = moment();
    const accountEnd = moment(user?.org?.accountEnd);

    const isAccountNotEnded = !now.isAfter(accountEnd);
    return isAccountNotEnded || permissions.isSuperuser(user);
  },
  isAccountActive (req) {
    const { user } = req;
    const org = user?.org;

    const isOrgActive = org && org.active !== false;
    const isUserActive = user && user.active !== false;
    return (isOrgActive || permissions.isSuperuser(user)) && isUserActive;
  },
  isEmailVerified (user) {
    return !!user?.emailVerified;
  },
  isSuperuser (user) {
    return user?.permission === 'superuser';
  },
  isAdmin (user) {
    return ['superuser', 'admin'].includes(user?.permission);
  },
  isAgent (user) {
    return user?.permission === 'agent';
  }
};

permissions.middleware = {
  isAuthenticated: (req, res, next) => {
    if (permissions.isAuthenticated(req)) {
      return next();
    }
    return res.jsonError(new Error('Permission denied'), 403);
  },
  isAccountActive: (req, res, next) => { // TODO: bad naming here... this checks active, ended & email verified
    if (!permissions.isAccountNotEnded(req)) {
      return res.jsonError(new Error('Account ended'), 403);
    }
    if (!permissions.isAccountActive(req)) {
      return res.jsonError(new Error('Account is inactive'), 403);
    }
    if (!permissions.isEmailVerified(req)) {
      return res.jsonError(new Error('Verify email'), 403);
    }
    return next();
  },
  isSuperuser: (req, res, next) => {
    if (permissions.isAuthenticated(req) && permissions.isSuperuser(req.user)) {
      return next();
    }
    return res.jsonError(new Error('Permission denied'), 403);
  },
  isAdmin: (req, res, next) => {
    if (permissions.isAuthenticated(req) && permissions.isAdmin(req.user)) {
      return next();
    }
    return res.jsonError(new Error('Permission denied'), 403);
  },
  isAgent: (req, res, next) => {
    if (permissions.isAuthenticated(req) && permissions.isAgent(req.user)) {
      return next();
    }
    return res.jsonError(new Error('Permission denied'), 403);
  }
};

module.exports = permissions;
