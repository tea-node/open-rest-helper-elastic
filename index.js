const list = require('./helper/list');
const beforeAdd = require('./helper/before-add');
const add = require('./helper/add');

module.exports = (rest) => {
  rest.helper.elastic = {
    list: list(rest),
    beforeAdd: beforeAdd(rest),
    add: add(rest),
  };

  return rest.helper.elastic;
};
