const express = require('express');

const passport = require('../passport');

const router = express.Router();

router.post('/', function handleLocalAuthentication (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      if (info === 'Account is inactive' || info === 'Verify email') {
        return res.jsonError(new Error(info), 401);
      }
      return res.jsonError(new Error('Incorrect user name or password.'), 401);
    }
    // Manually establish the session...
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.jsonSuccess(user);
    });
  })(req, res, next);
});

router.get('/google', passport.authenticate('google', {
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
}));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.CLIENT_HOST + '/login?error=No user found for this email address'
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_HOST + '/');
  });

module.exports = router;
