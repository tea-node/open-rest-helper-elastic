const get = require('lodash/get');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const isFunction = require('lodash/isFunction');
const each = require('lodash/each');
const map = require('lodash/map');
const extend = require('lodash/extend');
const has = require('lodash/has');
const keys = require('lodash/keys');

/* eslint camelcase: 0 */
const findOptFilter = (params, name, where = {}) => {
  const must = get(where, 'query.bool.must', []);
  const must_not = get(where, 'query.bool.must_not', []);

  let value;

  if (!params) return where;

  if (!isObject(params)) return where;

  // 等于
  if (isString(params[name])) {
    value = params[name].trim();
    if (value === '.null.') value = null;
    const item = {
      term: {
        [name]: value,
      },
    };
    must.push(item);
  }

  if (isNumber(params[name])) {
    value = +params[name];

    const item = {
      term: {
        [name]: value,
      },
    };

    must.push(item);
  }

  // 不等于
  if (isString(params[`${name}!`])) {
    value = params[`${name}!`].trim();
    if (value === '.null.') value = null;
    const item = {
      term: {
        [name]: value,
      },
    };
    must_not.push(item);
  }

  if (isNumber(params[`${name}!`])) {
    value = +params[`${name}!`];

    const item = {
      term: {
        [name]: value,
      },
    };
    must_not.push(item);
  }

  // 多个等于
  if (isString(params[`${name}s`])) {
    value = params[`${name}s`].trim().split(',');

    const item = {
      terms: {
        [name]: value,
      },
    };

    must.push(item);
  }

  // 多个不等于
  if (isString(params[`${name}s!`])) {
    value = params[`${name}s!`].trim().split(',');

    const item = {
      terms: {
        [name]: value,
      },
    };

    must_not.push(item);
  }

  each(['gt', 'gte', 'lt', 'lte'], (x) => {
    const key = `${name}_${x}`;
    if (!isString(params[key]) || isNumber(params[key])) return;
    value = isString(params[key]) ? params[key].trim() : params[key];

    const item = {
      range: {
        [name]: {
          [x]: value,
        },
      },
    };

    must.push(item);
  });

  const extentedWhere = {
    query: {
      bool: {},
    },
  };

  if (must.length) extentedWhere.query.bool.must = must;

  if (must_not.length) extentedWhere.query.bool.must_not = must_not;

  const ret = Object.assign({}, where, extentedWhere);

  return ret;
};

const defaultSort = [
  {
    createdAt: {
      order: 'desc',
    },
  },
];

const sort = (params, conf) => {
  const value = get(params, 'sort', null);

  if (!conf) return defaultSort;

  if (!(value || conf.default)) return defaultSort;

  if (!value) {
    const s = [
      {
        [conf.default]: {
          order: conf.defaultDirection || 'asc',
        },
      },
    ];

    return s;
  }

  const ret = [];

  const vs = value.trim().split(',');

  each(vs, (v) => {
    const isDesc = v[0] === '-';

    const direction = isDesc ? 'desc' : 'asc';
    const orderName = isDesc ? v.substring(1) : v;

    if (conf.allow && conf.allow.includes(orderName)) {
      const item = {
        [orderName]: {
          order: direction,
        },
      };

      ret.push(item);
    }
  });

  return ret.length ? ret : defaultSort;
};

const defaultPageParams = {
  startIndex: 0,
  maxResults: 10,
  maxStartIndex: 10000,
  maxResultsLimit: 1000,
};

/* eslint no-underscore-dangle: 0 */
const pageParams = (params, pagination) => {
  const _pagination = pagination || defaultPageParams;

  const startIndex = params && params.startIndex ? params.startIndex : _pagination.startIndex;
  const maxResults = params && params.maxResults ? params.maxResults : _pagination.maxResults;

  const from = Math.min(startIndex, _pagination.maxStartIndex || defaultPageParams.maxStartIndex);
  const size = Math.min(
    maxResults,
    _pagination.maxResultsLimit || defaultPageParams.maxResultsLimit,
  );

  return {
    from,
    size,
  };
};

const findAllOpts = (Model, params, isAll = false) => {
  let where = {};

  const attributes = Model.filterAttrs || keys(Model.rawAttributes);

  // 计算过滤条件，此处注意Model.rawAttributes默认为对应platform的全量attr
  each(attributes, (attr) => {
    where = findOptFilter(params, attr, where);
  });

  // 默认只搜索isDelete=no
  if (!params || !params.showDelete || params.showDelete === 'no') {
    const _params = {
      isDelete: 'no',
    };

    where = findOptFilter(_params, 'isDelete', where);
  }

  where.sort = sort(params, Model.sort);

  // 处理返回的字段
  (() => {
    if (!params || !params.attrs || !isString(params.attrs)) return;

    const _source = [];

    const attrs = params.attrs.trim().split(',');

    each(attrs, (attr) => {
      if (!Model.rawAttributes[attr]) return;
      _source.push(attr);
    });

    where._source = _source;
  })();

  if (!isAll) extend(where, pageParams(params, Model.pagination));

  const ret = {
    where,
  };

  return ret;
};

const isPromise = promise => !!promise
        && !!promise.then && isFunction(promise.then)
        && !!promise.catch && isFunction(promise.catch);

/**
 * 忽略list中的某些属性
 * 因为有些属性对于某些接口需要隐藏
 * 比如 medias/:media/campaigns 中项目的 mediaIds 就不能显示出来
 * 否则媒体就能知道该项目还投放了那些媒体
 */
const itemAttrFilter = (allowAttrs = []) => (x) => {
  const ret = allowAttrs.reduce((dict, attr) => {
    dict[attr] = x[attr];
    return dict;
  }, {});
  return ret;
};

const listAttrFilter = (ls, allowAttrs) => {
  if (!allowAttrs) return ls;
  return map(ls, itemAttrFilter(allowAttrs));
};

const NUMBER_TYPES = ['long', 'float'];

const pickParams = (req, cols, Model) => {
  const attr = {};
  const { params, isAdmin } = req;
  const { rawAttributes, onlyAdminCols } = Model;

  each(cols, (x) => {
    if (!has(params, x)) return;
    if (!rawAttributes[x]) return;
    const C = rawAttributes[x];

    // 当设置了只有管理员才可以修改的字段，并且当前用户不是管理员
    // 则去掉那些只有管理员才能修改的字段
    if (onlyAdminCols && isAdmin !== true && onlyAdminCols.includes(x)) {
      return;
    }

    let value = params[x];

    // 如果是数字类型的则数字化
    if (NUMBER_TYPES.includes(C.type)) {
      if (value != null) value = +value;
    }

    // 如果字段允许为空，且默认值为 null 则在等于空字符串的时候赋值为 null
    if (
      (value === '' || value === null || value === undefined)
      && has(C, 'defaultValue')
    ) {
      value = C.allowNull === true ? null : C.defaultValue;
    }

    attr[x] = value;
  });

  return attr;
};

const findOneOpts = (where = {}) => {
  const must = [];

  const whereKeys = keys(where);

  each(whereKeys, (name) => {
    const item = {
      term: {
        [name]: where[name],
      },
    };
    must.push(item);
  });

  const _where = {
    query: {
      bool: {
        must,
      },
    },
    size: 1,
  };

  const ret = {
    where: _where,
  };

  return ret;
};

module.exports = {
  sort,
  pageParams,
  findOptFilter,
  findAllOpts,
  isPromise,
  itemAttrFilter,
  listAttrFilter,
  pickParams,
  findOneOpts,
};
