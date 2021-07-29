const express = require('express');

const { permissions } = require('../utils');

const UserCtrl = require('../controllers/user');

const router = express.Router();

router.get('/verify-email', (req, res) => {
  const { token } = req.query;
  const { user } = req;

  return UserCtrl.verifyEmail(token, user)
    .then((user) => res.jsonSuccess(user))
    .catch((error) => res.jsonError(error));
});

router.get('/:userId', (req, res) => {
  const { userId } = req.params;
  const { user } = req;

  return UserCtrl.findById(userId, user)
    .then((user) => res.jsonSuccess(user))
    .catch((error) => res.jsonError(error));
});

router.put('/:userId', (req, res) => {
  const { userId } = req.params;
  const { user: userChanges } = req.body;
  const { user } = req;

  return UserCtrl.update(userId, userChanges, user)
    .then((user) => res.jsonSuccess(user))
    .catch((error) => res.jsonError(error));
});

router.get('/', permissions.middleware.isSuperuser, (req, res) => {
  const { user } = req;

  return UserCtrl.list(user, true)
    .then((users) => res.jsonSuccess(users))
    .catch((error) => res.jsonError(error));
});

/* delete */

router.delete('/:userId', (req, res) => {
  const { userId } = req.params;
  const { user } = req;

  return UserCtrl.delete(userId, user)
    .then((user) => res.jsonSuccess(user))
    .catch((error) => res.jsonError(error));
});

module.exports = router;
