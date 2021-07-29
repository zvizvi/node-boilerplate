const express = require('express');

const { permissions } = require('../utils');
const routerExtendRes = require('./router-extend-res');
const loginRouter = require('./login');
const orgRouter = require('./org');
const registerRouter = require('./register');
const userRouter = require('./user');
const adminRouter = require('./admin');
const publicFilesRouter = require('./public-files');

const router = express.Router();

const { isAuthenticated, isAccountActive, isAdmin, isSuperuser } = permissions.middleware;

router.use(routerExtendRes);

const logout = (req, res, next) => {
  req.logout();
  res.jsonSuccess('disconnected');
};

router.get('/is-authenticated', (req, res) => {
  if (req.isAuthenticated()) {
    return res.jsonSuccess(req.user);
  }

  // !TODO agent's session was deleted
  // if (USER_IS_NOT_ACTIVE) {
  //   return res.jsonError(new Error('Account is inactive'), 401);
  // }
  return res.jsonError(new Error('Authentication failed'), 403);
});

router.use('/logout', logout);
router.use('/login', loginRouter);
router.use('/register', registerRouter);
router.use('/org', isAuthenticated, isAccountActive, orgRouter);
router.use('/user', isAuthenticated, isAccountActive, userRouter);
router.use('/admin', isSuperuser, adminRouter);
router.use('/public-files', publicFilesRouter);

router.get('/', (req, res) => {
  res.send('<h1>API</h1><hr/>');
});

module.exports = router;
