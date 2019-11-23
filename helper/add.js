const delegate = require('func-delegate');
const each = require('lodash/each');
const isString = require('lodash/isString');
const beforeAdd = require('./before-add');
const detailHelper = require('./detail');

/* eslint no-underscore-dangle: 0 */
module.exports = (rest) => {
  /**
   * 根据资源描述添加资源到集合上的方法
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许修改的字段
   * hook 必选, 实例的存放位置
   * attachs 可选，要附加输出的数据格式为 key => value, value 是 req 上的路径字符串
   */
  const add = (Model, cols, hook, attachs) => {
    // 这里hook其实是必须的，因为这里把 add 分成两个部分，
    // 为了避免冲突导致，这里引入了随机字符串
    const _hook = hook || `${Model.name}_${rest.utils.randStr(10)}`;

    const before = beforeAdd(rest)(Model, cols, _hook);
    const detail = detailHelper(rest)(_hook, attachs, 201);

    return (req, res, next) => {
      before(req, res, (error) => {
        if (error) return next(error);
        return detail(req, res, next);
      });
    };
  };

  const schemas = [{
    name: 'Model',
    type: Object,
    message: 'Model must be a object',
  }, {
    name: 'cols',
    type: Array,
    allowNull: true,
    validate: {
      check(keys, schema, args) {
        const Model = args[0];
        each(keys, (v) => {
          if (!isString(v)) {
            throw Error('Every item in cols must be a string.');
          }
          if (!Model.rawAttributes[v]) {
            throw Error(`Attr non-exists: ${v}`);
          }
        });
        return true;
      },
    },
    message: 'Allow writed attrs\'s name array',
  }, {
    name: 'hook',
    type: String,
    allowNull: true,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string',
  }, {
    name: 'attachs',
    type: Object,
    allowNull: true,
    validate: {
      check(value) {
        each(value, (v) => {
          if (!isString(v)) {
            throw Error('The attachs structure is key = > value, value must be a string');
          }
        });
        return true;
      },
    },
    message: 'Attach other data dict. key => value, value is req\'s path',
  }];

  return delegate(add, schemas);
};
