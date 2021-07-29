const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const { permissions } = require('../utils');
const { User, Org } = require('../models');
const UserCtrl = require('../controllers/user');

// Serialize sessions
passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser((id, done) => {
  return User.findOne({
    where: { id },
    include: [{
      model: Org
    }],
    attributes: {
      exclude: ['passwordHash']
    }
  })
    .then((user) => {
      // TODO: a user can exist without being related to an org!
      if ((user?.org?.active === false && !permissions.isSuperuser(user)) || user?.active === false) {
        done(null, null);
      } else {
        done(null, user);
      }
      return null;
    })
    .catch((err) => {
      done(err, null);
      return null;
    });
});

// Use local strategy to create user account
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, basicAuth));

if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
  let user;
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackURL: process.env.SERVER_HOST + '/login/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    const profileEmail = profile?.emails?.[0]?.value;
    user = await User.findOne({
      where: {
        email: profileEmail
      }
    });
    if (!user) {
      // return todo?
      user = await UserCtrl.create({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profileEmail,
        permission: 'admin',
        googleId: profile.id
      });
    } else {
      if (!user.googleId) {
        user.update({ googleId: profile?.id });
      }
      if (!user.emailVerified) {
        await user.update({ emailVerified: true });
      }
      return done(null, user);
    }
  }));
}

module.exports = passport;

async function basicAuth (email, password, done) {
  email = email || '';
  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: Org,
        include: [{
          model: User,
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'email', 'active']
        }]
      }]
    });
    if (!user) {
      return done(null, false, 'Unknown user');
    } else if (!UserCtrl.comparePassword(password, user.passwordHash)) {
      return done(null, false, 'Invalid password');
    } else if ((user?.org?.active === false && !permissions.isSuperuser(user)) || user.active === false) {
      return done(null, false, 'Account is inactive');
      // !TODO, also send verification email @user.js:40
      // else if (!user.emailVerified) {
      //   return done(null, false, 'Verify email');
      // }
    } else {
      delete user.dataValues.passwordHash;
      delete user._previousDataValues.passwordHash;
      return done(null, user);
    }
  } catch (err) {
    return done(err);
  }
}
