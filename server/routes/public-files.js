const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/*', (req, res) => {
  const filePath = req.url.split('?')[0];

  return res.sendFile(filePath, { root: path.join(__dirname, '../../media/files/public') }, (err) => {
    if (err) {
      console.log(err);
      res.jsonError(new Error('File not found'), 404);
    }
  });
});

module.exports = router;
