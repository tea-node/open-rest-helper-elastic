const delegate = require('func-delegate');
const each = require('lodash/each');
const isString = require('lodash/isString');
const isFunction = require('lodash/isFunction');
const extend = require('lodash/extend');
const U = require('../lib/utils');

/* eslint no-underscore-dangle: 0 */
module.exports = (rest) => {
  /**
   * 修改某个资源描述的前置方法, 不会sync到数据库
   * Model 必选, Sequlize 定义的Model，表明数据的原型
   * cols 可选, 允许设置的字段
   * hook 必选, 生成实例的存放位置
   */
  const beforeAdd = (Model, cols, hook) => (
    async (req, res, next) => {
      const attr = U.pickParams(req, cols || Model.writableCols, Model);

      // 存储数据
      const _save = async (model) => {
        try {
          const mod = await model.save();
          req.hooks[hook] = mod;
          next();
        } catch (error) {
          next(rest.errors.sequelizeIfError(error));
        }
      };

      // 约定的 creatorId, 等于 req.user.id
      if (Model.rawAttributes.creatorId) attr.creatorId = req.user.id;
      // 约定的 clientIp, 等于rest.utils.clientIp(req)
      if (Model.rawAttributes.clientIp) attr.clientIp = rest.utils.clientIp(req);

      // 如果没有设置唯一属性，或者没有开启回收站
      if ((!Model.unique) || (!Model.rawAttributes.isDelete)) {
        return _save(Model.build(attr));
      }

      // 如果设置了唯一属性，且开启了回收站功能
      // 则判断是否需要执行恢复操作
      const where = {};

      each(Model.unique, (x) => {
        where[x] = attr[x];
      });

      const options = U.findOneOpts(where);

      const _model = await Model.findOne(options);

      if (_model) {
        // 且资源曾经被删除
        if (_model.isDelete === 'yes') {
          extend(_model, attr);
          // 恢复为正常状态
          _model.isDelete = 'no';
        } else {
          return next(rest.errors.ifError(Error('Resource exists.'), Model.unique[0]));
        }
      }

      const mod = _save(_model || Model.build(attr));

      return mod;
    }
  );

  const schemas = [{
    name: 'Model',
    type: Object,
    message: 'Model must be has findOne and build functions',
    validate: {
      check(keys, schema, args) {
        const Model = args[0] || {};

        if (!Model.build || !isFunction(Model.build)) {
          throw Error('Model.build must be a function');
        }

        if (!Model.save || !isFunction(Model.save)) {
          throw Error('Model.save must be a function');
        }

        if (!Model.findOne || !isFunction(Model.findOne)) {
          throw Error('Model.findOne must be a function');
        }

        return true;
      },
    },
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
    allowNull: false,
    message: 'Added instance will hook on req.hooks[hook], so `hook` must be a string',
  }];

  return delegate(beforeAdd, schemas);
};
