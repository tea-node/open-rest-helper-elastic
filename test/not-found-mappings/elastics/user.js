const ModelBase = require('./base');

module.exports = (client) => {
  const Model = ModelBase.define('user', client);
  return Model;
};
