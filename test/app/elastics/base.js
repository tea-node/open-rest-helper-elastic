const isObject = require('lodash/isObject');
const isEmpty = require('lodash/isEmpty');
const each = require('lodash/each');

class ModelBase {
  constructor(name, client) {
    this.name = name;
    this.client = client;
    this.mappings = null;
  }

  static define(name, client) {
    const base = new ModelBase(name, client);
    return base;
  }

  setMappings(mappings) {
    this.mappings = mappings;
  }

  getMappings() {
    return this.mappings;
  }

  extend(extended) {
    if (extended && isObject(extended) && !isEmpty(extended)) {
      each(extended, (v, k) => {
        this[k] = v;
      });
    }
  }
}

module.exports = ModelBase;
