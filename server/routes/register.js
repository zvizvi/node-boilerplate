const express = require('express');

const RegisterCtrl = require('../controllers/register');

const router = express.Router();

router.post('/', (req, res) => {
  const { userFields, orgFields } = req.body;

  return RegisterCtrl.register(userFields, orgFields, req?.user?.id)
    .then((result) => res.jsonSuccess(result))
    .catch((error) => res.jsonError(error));
});

router.post('/check-registered', (req, res) => {
  const { email } = req.body;
  const { user } = req;

  return RegisterCtrl.checkRegisteredEmail(email, user)
    .then((result) => res.jsonSuccess(result))
    .catch((error) => res.jsonError(error));
});

module.exports = router;
