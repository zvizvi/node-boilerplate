const nodeAsk = require('node-ask');

require('./config/config');
const init = require('./db/initialize');

nodeAsk.confirm('Are you sure? (y/N)')
  .then((answer) => {
    if (answer) {
      init.initAll();
    } else {
      process.exit();
    }
  });
