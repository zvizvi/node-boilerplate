const _ = require('lodash');
const moment = require('moment');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

// TODO: document format, some schema checking and error handling

function parseOrExpression (expression) {
  const orArray = [];
  expression.split('||').forEach((andExpression) => {
    orArray.push({ [Op.and]: parseAndExpression(andExpression) });
  });
  return orArray;
}

function parseAndExpression (expression) {
  const andArray = [];
  expression.split('&&').forEach((whereExpression) => {
    andArray.push(parseWhereExpression(whereExpression));
  });
  return andArray;
}

function parseWhereExpression (whereExpression) {
  switch (whereExpression[0]) {
    case '!':
      return { [Op.not]: whereExpression.substr(1) };
    case '$': {
      const rest = whereExpression.substr(1);
      let [op, ...args] = rest.split(':');
      args = args.join(':'); // rejoin remaining string
      switch (op) {
        case 'num-gt':
          return { [Op.gt]: args };
        case 'num-lt':
          return { [Op.lt]: args };
        case 'num-gte':
          return { [Op.gte]: args };
        case 'num-lte':
          return { [Op.lte]: args };
        case 'date-gte':
          return { [Op.gte]: moment(args).startOf('day').toISOString() };
        case 'date-lte':
          return { [Op.lte]: moment(args).endOf('day').toISOString() };
        case 'null':
          return { [Op.is]: null };
      }
      break;
    }
    case '%':
      return { [Op.iLike]: whereExpression + '%' };
    default:
      return { [Op.eq]: parseValue(whereExpression) };
  }
  // Invalid &*: operator. Fall back to raw value
  return { [Op.eq]: parseValue(whereExpression) };
}

function parseValue (value) {
  return value;
}

function parseQueryFilter (filtersObject, whereObject = {}, functions = {}) {
  if (_.isObject(filtersObject)) {
    if (!whereObject[Op.and]) {
      whereObject[Op.and] = [];
    }
    Object.entries(filtersObject).forEach(([key, orExpression]) => {
      if (orExpression !== undefined) {
        if (key.startsWith('func:')) {
          whereObject[Op.and].push(Sequelize.where(functions[key.split(':')[1]], { [Op.or]: parseOrExpression(orExpression) }));
        } else {
          whereObject[key] = { [Op.or]: parseOrExpression(orExpression) };
        }
      }
    });
  }
}

module.exports = parseQueryFilter;
