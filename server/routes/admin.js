const express = require('express');

const AdminCtrl = require('../controllers/admin');

const router = express.Router();

router.post('/login-as-org', (req, res) => {
  const { orgId } = req.query;
  const { user } = req;

  return AdminCtrl.joinOrgAsInvisibleUser(orgId, user)
    .then((org) => res.jsonSuccess(org))
    .catch((error) => res.jsonError(error));
});

module.exports = router;
