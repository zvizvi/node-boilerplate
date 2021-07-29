const fs = require('fs');
const path = require('path');
const { isString, trim } = require('lodash');

const permissions = require('./permissions');
const parseQueryFilter = require('./parse-query-filter');

const utils = {
  permissions,
  parseQueryFilter,
  trim (value) {
    if (!isString(value)) {
      return value;
    }
    return trim(value) || null;
  },
  parseJson (json) {
    if (!json) {
      return; // ignore empty json
    }
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      console.log('Json SyntaxError: ', e);
    }
    return parsed; // Could be undefined!
  },
  ensureDirectoryExistence (filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    utils.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  },
  removeEmptyStringKeys (object) {
    Object.keys(object).forEach((key) => {
      if (object[key] && typeof object[key] === 'object') {
        utils.removeEmptyStringKeys(object[key]);
      } else if (object[key] === '') {
        delete object[key];
      }
    });
  },
  unparam (param) {
    param = param || '';
    if (param[0] === '?') param = param.slice(1);
    const re = {};
    for (let i = 0, arr = param.split('&'), kv; kv = arr[i]; i++) { // eslint-disable-line no-cond-assign
      kv = kv.split('=');
      re[kv[0]] = kv[1];
    }
    return re;
  }
};

module.exports = utils;
