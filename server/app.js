require('./config/config');

const http = require('http');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const connectSessionSequelize = require('connect-session-sequelize');
const morgan = require('morgan'); // logging middleware

const passport = require('./passport');
const cross = require('./cross.js');
const sequelizeConnect = require('./db/connect');

const apiRouter = require('./routes');

/* express */
const app = express();
const PORT = process.env.PORT || '8089';
const SESSION_SECRET = process.env.SESSION_SECRET || 'lkMChghWEdgvV';

/* body parser */
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }));

cross(app);

/* passport */
const Store = connectSessionSequelize(session.Store);
const cookieMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

function extendDefaultFields (defaults, session) {
  return {
    data: defaults.data,
    expires: defaults.expires,
    userId: session?.passport?.user
  };
}

app.use(session({
  store: new Store({ db: sequelizeConnect, extendDefaultFields, table: 'Session' }),
  saveUninitialized: false,
  secret: SESSION_SECRET,
  resave: true,
  cookie: { maxAge: cookieMaxAge }
}));

app.use(passport.initialize());
app.use(passport.session());

/* log */
app.use(morgan('dev'));

/* routes */
app.use('/', apiRouter);

/* server */
const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`
  Starting Web Server on Port ${PORT}...

  ╭─────────────────────────────────────╮
  │                                     │
  │     url: http://127.0.0.1:${PORT}      │
  │                                     │
  ╰─────────────────────────────────────╯
  `);
});

server.on('error', (err) => console.log('ERROR!', err));
