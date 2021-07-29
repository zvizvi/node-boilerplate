const moment = require('moment');
const cron = require('node-cron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDir = path.join(__dirname, '../../', 'media/db-backups');
!fs.existsSync(backupDir) && fs.mkdirSync(backupDir);

function runBackup () {
  const outFile = `${backupDir}/backup-${new Date().getTime()}.sql`;
  console.log(outFile);
  const backupProcess = spawn('pg_dump', ['-f',
    outFile,
    '-Fp' /* plain format */,
    '-c' /* drop objects before recreating */
  ], {
    env: {
      PGPASSWORD: process.env.DB_PASSWORD,
      PGDATABASE: process.env.DB_NAME,
      PGHOST: process.env.DB_HOST,
      PGUSER: process.env.DB_USERNAME
    },
    stdio: [0, 1, 2] // use parent's stdin, stdout, and stderr
  });
  backupProcess.on('exit', (code) => {
    const succeeded = !code;
    if (succeeded) {
      console.log(`Backup to file ${outFile} succeeded!`);
    } else {
      console.error(`Backup to file ${outFile} failed with code '${code}'`);
    }
  });
}

if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 3 * * *', () => { // Every day at 3:00am
    console.log('Running scheduled cron job: Backup DB', moment().format('DD/MM/YYYY HH:mm'));
    runBackup();
  }, {
    scheduled: true,
    timezone: 'Asia/Jerusalem'
  });
}
