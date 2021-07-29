module.exports = {
  apps: [
    {
      name: 'development',
      script: 'app.js',
      output: '../media/log/out.log',
      error: '../media/log/error.log',
      log: '../media/log/log.log',
      time: true
    }
  ]
};
