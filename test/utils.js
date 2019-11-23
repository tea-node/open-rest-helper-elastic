const assert = require('assert');

const {
  findOptFilter,
  findAllOpts,
  sort,
  pageParams,
  isPromise,
  itemAttrFilter,
  listAttrFilter,
  pickParams,
} = require('../lib/utils');

/* global describe it */
describe('utils', () => {
  describe('#findOptFilter', () => {
    it('params is invalid', () => {
      const actual = findOptFilter();
      assert.deepEqual(actual, {});
    });

    it('params is not a object', () => {
      const actual = findOptFilter('');
      assert.deepEqual(actual, {});
    });

    it('params is not a object', () => {
      const actual = findOptFilter('');
      assert.deepEqual(actual, {});
    });

    it('name is not a object property', () => {
      const actual = findOptFilter({}, 'abc');
      assert.deepEqual(actual, { query: { bool: {} } });
    });

    it('return dsl when params.firstName is .null.', () => {
      const actual = findOptFilter({ name: '.null.' }, 'name');
      const expected = {
        query: {
          bool: {
            must: [
              {
                term: {
                  name: null,
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params.firstName is string value', () => {
      const actual = findOptFilter({ name: 'bmw' }, 'name');
      const expected = {
        query: {
          bool: {
            must: [
              {
                term: {
                  name: 'bmw',
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params[`name!`] is string value', () => {
      const actual = findOptFilter({ 'name!': 'bmw' }, 'name');
      const expected = {
        query: {
          bool: {
            must_not: [
              {
                term: {
                  name: 'bmw',
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params.firstNames is a array of string value', () => {
      const actual = findOptFilter({ names: 'bmw,宝马' }, 'name');
      const expected = {
        query: {
          bool: {
            must: [
              {
                terms: {
                  name: ['bmw', '宝马'],
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params[`names!`] is a array of string value', () => {
      const actual = findOptFilter({ 'names!': 'bmw,宝马' }, 'name');
      const expected = {
        query: {
          bool: {
            must_not: [
              {
                terms: {
                  name: ['bmw', '宝马'],
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params.followers is number value', () => {
      const actual = findOptFilter({ followers: 1 }, 'followers');
      const expected = {
        query: {
          bool: {
            must: [
              {
                term: {
                  followers: 1,
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when params[`followers!`] is number value', () => {
      const actual = findOptFilter({ 'followers!': 1 }, 'followers');
      const expected = {
        query: {
          bool: {
            must_not: [
              {
                term: {
                  followers: 1,
                },
              },
            ],
          },
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('return dsl when params[`followers!`] is string value', () => {
      const actual = findOptFilter({ 'followers!': '1' }, 'followers');
      const expected = {
        query: {
          bool: {
            must_not: [
              {
                term: {
                  followers: '1',
                },
              },
            ],
          },
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('return dsl when params.followerss is number value', () => {
      const actual = findOptFilter({ followerss: '1,2' }, 'followers');

      const expected = {
        query: {
          bool: {
            must: [
              {
                terms: {
                  followers: ['1', '2'],
                },
              },
            ],
          },
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('return dsl when params[`followerss!`] is number value', () => {
      const actual = findOptFilter({ 'followerss!': '1,2' }, 'followers');
      const expected = {
        query: {
          bool: {
            must_not: [
              {
                terms: {
                  followers: ['1', '2'],
                },
              },
            ],
          },
        },
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when special dsl', () => {
      const actual = findOptFilter({ name: 'bmw' }, 'name', { size: 100 });
      const expected = {
        query: {
          bool: {
            must: [
              {
                term: {
                  name: 'bmw',
                },
              },
            ],
          },
        },
        size: 100,
      };
      assert.deepEqual(actual, expected);
    });

    it('return dsl when dsl already has must items', () => {
      const dsl = {
        query: {
          bool: {
            must: [
              {
                term: {
                  gender: '男',
                },
              },
            ],
          },
        },
        size: 100,
      };
      const actual = findOptFilter({ name: 'bmw' }, 'name', dsl);
      const expected = {
        query: {
          bool: {
            must: [
              {
                term: {
                  gender: '男',
                },
              },
              {
                term: {
                  name: 'bmw',
                },
              },
            ],
          },
        },
        size: 100,
      };
      assert.deepEqual(actual, expected);
    });
  });
  describe('#findAllOpts', () => {
    it('no params', () => {
      const Model = {};

      const actual = findAllOpts(Model);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('params.abc not in Model.filterAttrs', () => {
      const Model = {
        filterAttrs: ['firstName'],
        rawAttributes: {
          id: {
            type: 'long',
          },
          firstName: {
            type: 'keyword',
          },
          lastName: {
            type: 'keyword',
          },
        },
      };

      const params = {
        abc: 1,
      };

      const actual = findAllOpts(Model, params);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('params.firstName in Model.filterAttrs', () => {
      const Model = {
        filterAttrs: ['firstName'],
        rawAttributes: {
          id: {
            type: 'long',
          },
          firstName: {
            type: 'keyword',
          },
          lastName: {
            type: 'keyword',
          },
        },
      };

      const params = {
        firstName: 'elastic',
      };

      const actual = findAllOpts(Model, params);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    firstName: 'elastic',
                  },
                },
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('params.firstName, parmas.gender in Model.filterAttrs', () => {
      const Model = {
        filterAttrs: ['firstName', 'gender'],
        rawAttributes: {
          id: {
            type: 'long',
          },
          firstName: {
            type: 'keyword',
          },
          lastName: {
            type: 'keyword',
          },
        },
      };

      const params = {
        firstName: 'elastic',
        gender: 'female',
      };

      const actual = findAllOpts(Model, params);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    firstName: 'elastic',
                  },
                },
                {
                  term: {
                    gender: 'female',
                  },
                },
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('params.firstName, parmas.gender, params.folllowers in Model.filterAttrs', () => {
      const Model = {
        filterAttrs: ['firstName', 'gender', 'followers'],
        rawAttributes: {
          id: {
            type: 'long',
          },
          firstName: {
            type: 'keyword',
          },
          lastName: {
            type: 'keyword',
          },
          gender: {
            type: 'keyword',
          },
          followers: {
            type: 'float',
          },
        },
      };

      const params = {
        firstName: 'elastic',
        gender: 'female',
        followers: 1000,
      };

      const actual = findAllOpts(Model, params);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  term: {
                    firstName: 'elastic',
                  },
                },
                {
                  term: {
                    gender: 'female',
                  },
                },
                {
                  term: {
                    followers: 1000,
                  },
                },
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('params.firstNames, parmas.gender, params.folllowers in Model.filterAttrs', () => {
      const Model = {
        filterAttrs: ['firstName', 'gender', 'followers'],
        rawAttributes: {
          id: {
            type: 'long',
          },
          firstName: {
            type: 'keyword',
          },
          lastName: {
            type: 'keyword',
          },
          gender: {
            type: 'keyword',
          },
          followers: {
            type: 'float',
          },
        },
      };

      const params = {
        firstNames: 'elastic,search',
        gender: 'female',
        followers: 1000,
      };

      const actual = findAllOpts(Model, params);

      const expected = {
        where: {
          query: {
            bool: {
              must: [
                {
                  terms: {
                    firstName: [
                      'elastic',
                      'search',
                    ],
                  },
                },
                {
                  term: {
                    gender: 'female',
                  },
                },
                {
                  term: {
                    followers: 1000,
                  },
                },
                {
                  term: {
                    isDelete: 'no',
                  },
                },
              ],
            },
          },
          sort: [
            {
              createdAt: {
                order: 'desc',
              },
            },
          ],
          from: 0,
          size: 10,
        },
      };

      assert.deepEqual(actual, expected);
    });
  });
  describe('#sort', () => {
    it('no input', () => {
      const actual = sort();
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('no conf', () => {
      const params = {
        sort: 'createdAt',
      };
      const actual = sort(params);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('no conf', () => {
      const params = {
        sort: 'createdAt',
      };
      const actual = sort(params);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('no sort value', () => {
      const params = {
        sort: null,
      };
      const actual = sort(params);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('no conf default', () => {
      const params = {
        sort: 'createdAt',
      };
      const conf = {
        default: null,
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('conf default, no value', () => {
      const params = {
        sort: null,
      };
      const conf = {
        default: 'createdAt',
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'asc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('no conf.allow', () => {
      const params = {
        sort: 'createdAt',
      };
      const conf = {
        default: 'createdAt',
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('sort not in conf.allow', () => {
      const params = {
        sort: 'id',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return asc createdAt', () => {
      const params = {
        sort: 'createdAt',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'asc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return desc createdAt', () => {
      const params = {
        sort: '-createdAt',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return asc createdAt, followers', () => {
      const params = {
        sort: 'createdAt,followers',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt', 'followers'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'asc',
          },
        },
        {
          followers: {
            order: 'asc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return desc createdAt, asc followers', () => {
      const params = {
        sort: '-createdAt,followers',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt', 'followers'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
        {
          followers: {
            order: 'asc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return asc createdAt, desc followers', () => {
      const params = {
        sort: 'createdAt,-followers',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt', 'followers'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'asc',
          },
        },
        {
          followers: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });

    it('return desc createdAt, followers', () => {
      const params = {
        sort: '-createdAt,-followers',
      };
      const conf = {
        default: 'createdAt',
        allow: ['createdAt', 'followers'],
      };
      const actual = sort(params, conf);
      const expected = [
        {
          createdAt: {
            order: 'desc',
          },
        },
        {
          followers: {
            order: 'desc',
          },
        },
      ];
      assert.deepEqual(actual, expected);
    });
  });
  describe('#sort', () => {
    it('no input', () => {
      const actual = pageParams();
      const expected = {
        from: 0,
        size: 10,
      };
      assert.deepEqual(actual, expected);
    });

    it('no pagination', () => {
      const params = {
        startIndex: 10,
        maxResults: 10,
      };
      const actual = pageParams(params);
      const expected = {
        from: 10,
        size: 10,
      };
      assert.deepEqual(actual, expected);
    });

    it('return params.startIndex=20, params.maxResults=20', () => {
      const pagination = {
        startIndex: 10,
        maxResults: 10,
      };

      const params = {
        startIndex: 20,
        maxResults: 20,
      };

      const actual = pageParams(params, pagination);

      const expected = {
        from: 20,
        size: 20,
      };

      assert.deepEqual(actual, expected);
    });

    it('return params.startIndex=10000, params.maxResults=20', () => {
      const pagination = {
        startIndex: 10,
        maxResults: 10,
      };

      const params = {
        startIndex: 10001,
        maxResults: 20,
      };

      const actual = pageParams(params, pagination);

      const expected = {
        from: 10000,
        size: 20,
      };

      assert.deepEqual(actual, expected);
    });

    it('return params.startIndex=10000, params.maxResults=1000', () => {
      const pagination = {
        startIndex: 10,
        maxResults: 10,
      };

      const params = {
        startIndex: 10001,
        maxResults: 1001,
      };

      const actual = pageParams(params, pagination);

      const expected = {
        from: 10000,
        size: 1000,
      };

      assert.deepEqual(actual, expected);
    });
  });
  describe('#isPromise', () => {
    it('no input', () => {
      const actual = isPromise();
      assert.equal(actual, false);
    });
    it('no then and catch function', () => {
      const promise = {};
      const actual = isPromise(promise);
      assert.equal(actual, false);
    });

    it('promise.then not a function', () => {
      const promise = {
        then: {},
      };
      const actual = isPromise(promise);
      assert.equal(actual, false);
    });

    it('promise.then is a function', () => {
      const promise = {
        then: () => true,
      };
      const actual = isPromise(promise);
      assert.equal(actual, false);
    });

    it('promise.catch not a function', () => {
      const promise = {
        then: () => true,
        catch: {},
      };
      const actual = isPromise(promise);
      assert.equal(actual, false);
    });

    it('promise.catch is a function', () => {
      const promise = {
        then: () => true,
        catch: () => false,
      };
      const actual = isPromise(promise);
      assert.equal(actual, true);
    });

    it('Promise.resolve', () => {
      const promise = Promise.resolve();
      const actual = isPromise(promise);
      assert.equal(actual, true);
    });
  });
  describe('#itemAttrFilter', () => {
    it('noraml', (done) => {
      const fn = itemAttrFilter(['name', 'age', 'gender']);
      const obj = {
        name: 'Jason Bai',
        age: 30,
        gender: 'male',
        email: '602316022@qq.com',
        address: '北京市昌平区',
      };

      assert.deepEqual(
        {
          name: 'Jason Bai',
          age: 30,
          gender: 'male',
        },
        fn(obj),
      );

      done();
    });
  });
  describe('#listAttrFilter', () => {
    it('normal', (done) => {
      const ls = [
        {
          name: 'Jason Bai',
          age: 30,
          gender: 'male',
          email: '602316022@qq.com',
          address: '北京市昌平区',
        },
      ];
      assert.deepEqual(
        [
          {
            name: 'Jason Bai',
            age: 30,
            gender: 'male',
          },
        ],
        listAttrFilter(ls, ['name', 'age', 'gender']),
      );

      done();
    });

    it('allowAttrs unset', (done) => {
      const ls = [
        {
          name: 'Jason Bai',
          age: 30,
          gender: 'male',
          email: '602316022@qq.com',
          address: '北京市昌平区',
        },
      ];
      assert.deepEqual(
        [
          {
            name: 'Jason Bai',
            age: 30,
            gender: 'male',
            email: '602316022@qq.com',
            address: '北京市昌平区',
          },
        ],
        listAttrFilter(ls),
      );

      done();
    });
  });
  describe('#pickParams', () => {
    it('onlyAdminCols, current isnt admin', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
        },
        isAdmin: false,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          name: 'Jason Bai',
        },
        pickParams(req, ['name', 'role'], Model),
      );

      done();
    });

    it('onlyAdminCols, current isnt admin', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
          status: 'enabled',
        },
        isAdmin: false,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          name: 'Jason Bai',
        },
        pickParams(req, ['name', 'role', 'status', 'email'], Model),
      );

      done();
    });

    it('column is number type, value isnt null', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
          status: 'enabled',
          price: '999999',
        },
        isAdmin: false,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          price: {
            type: 'float',
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          price: 999999,
        },
        pickParams(req, ['price'], Model),
      );

      done();
    });

    it('column is number type, value is null, allowNull false', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
          status: 'enabled',
          price: null,
        },
        isAdmin: true,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          price: {
            type: 'float',
            defaultValue: 888888,
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          name: 'Jason Bai',
          role: 'admin',
          price: 888888,
        },
        pickParams(req, ['price', 'name', 'role'], Model),
      );

      done();
    });

    it('column is number type, value is null, allowNull: true', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
          status: 'enabled',
          price: null,
        },
        isAdmin: true,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          price: {
            type: 'float',
            allowNull: true,
            defaultValue: 888888,
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          name: 'Jason Bai',
          role: 'admin',
          price: null,
        },
        pickParams(req, ['price', 'name', 'role'], Model),
      );

      done();
    });

    it('column is number type, value is 0, allowNull: true', (done) => {
      const req = {
        params: {
          name: 'Jason Bai',
          role: 'admin',
          status: 'enabled',
          price: 0,
        },
        isAdmin: true,
      };

      const Model = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'text',
          },
          price: {
            type: 'float',
            allowNull: true,
            defaultValue: 888888,
          },
          role: {
            type: 'keyword',
          },
        },
      };

      Model.onlyAdminCols = ['role'];

      assert.deepEqual(
        {
          name: 'Jason Bai',
          role: 'admin',
          price: 0,
        },
        pickParams(req, ['price', 'name', 'role'], Model),
      );

      done();
    });
  });
});
