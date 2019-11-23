const delegate = require('func-delegate');
const isFunction = require('lodash/isFunction');
const isString = require('lodash/isString');
const each = require('lodash/each');
const U = require('../lib/utils');

/**
 * 获取总量
 * @param {*} Model Model类
 * @param {*} opt 参数项
 */
const getTotal = async (Model, opt) => {
  const total = await Model.count(opt);
  return total;
};

/**
 * 获取部分数据
 * @param {*} Model Model类
 * @param {*} opt 参数项
 * @param {*} allowAttrs 可选属性
 * @param {*} hook 钩子名称
 * @param {*} fixOptFn 修正函数
 */
const list = (Model, opt, allowAttrs, hook, fixOptFn) => (
  async (req, res, next) => {
    const params = req.params;

    const options = opt ? req.hooks[opt] : U.findAllOpts(Model, req.params);
    const countOpt = {};

    if (options.where) countOpt.where = options.where;

    // 完善opt
    if (fixOptFn && isFunction(fixOptFn)) fixOptFn(options, params);

    /* eslint no-underscore-dangle: 0 */
    const ignoreTotal = req.params._ignoreTotal === 'yes';

    let total = 0;

    if (!ignoreTotal) {
      total = await getTotal(Model, countOpt);
    }

    let result = [];

    if (!ignoreTotal && total) {
      result = await Model.findAll(options);
    }

    let ls = U.listAttrFilter(result, allowAttrs);

    if (!ignoreTotal) res.header('X-Content-Record-Total', total);

    if (!hook && params.attrs) {
      ls = U.listAttrFilter(ls, params.attrs.split(','));
    }

    if (hook) {
      req.hooks[hook] = ls;
    } else {
      res.send(ls);
    }

    return next();
  }
);

module.exports = () => {
  const schemas = [{
    name: 'Model',
    type: Object,
    message: 'Model must be has count and findAll functions',
    validate: {
      check(keys, schema, args) {
        const Model = args[0] || {};

        if (!Model.count || !isFunction(Model.count)) {
          throw Error('Model.count must be a function');
        }

        if (!Model.findAll || !isFunction(Model.findAll)) {
          throw Error('Model.findAll must be a function');
        }

        return true;
      },
    },
  }, {
    name: 'opt',
    type: String,
    allowNull: true,
    message: "FindAll option hooks's name, so `opt` must be a string",
  }, {
    name: 'allowAttrs',
    type: Array,
    allowNull: true,
    validate: {
      check(keys, schema, args) {
        const Model = args[0];
        each(keys, (v) => {
          if (!isString(v)) {
            throw Error('Every item in allowAttrs must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error(`Attr non-exists: ${v}`);
          }
        });
        return true;
      },
    },
    message: 'Allow return attrs\'s name array',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Geted list will hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'fixOptFn',
    type: Function,
    allowNull: true,
    message: 'FixOptFn must be a function',
  }];

  return delegate(list, schemas);
};
