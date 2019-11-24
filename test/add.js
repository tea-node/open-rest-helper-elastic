const assert = require('assert');
const rest = require('open-rest');
const _ = require('lodash');
const extend = require('lodash/extend');

const helper = require('../')(rest);

const Model = {
  rawAttributes: {
    id: {
      type: 'long',
    },
    name: {
      type: 'text',
    },
    age: {
      type: 'long',
    },
  },
  build(attrs) {
    return extend({}, attrs, {
      save() {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(extend({}, attrs, {
              id: 1,
            }));
          }, 10);
        });
      },
    });
  },
  save() {
    return {
      id: 1,
      name: 'Jason Bai',
      age: 36,
      address: '北京市昌平区',
    };
  },
  findOne() {
    return {};
  },
};

/* global describe it */
describe('open-rest-helper-elastic-add', () => {
  describe('Argument validate error', () => {
    it('cols type error', (done) => {
      assert.throws(() => {
        helper.add(Model, 'string');
      }, err => err instanceof Error && err.message === "Allow writed attrs's name array");
      done();
    });
    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.add(Model, [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });
    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.add(Model, ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, {});
      }, (err) => {
        const msg = 'Added instance will hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
    it('attrs type error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, null, 'string');
      }, (err) => {
        const msg = 'Attach other data dict. key => value, value is req\'s path';
        return err instanceof Error && err.message === msg;
      });

      done();
    });
    it('attrs check error', (done) => {
      assert.throws(() => {
        helper.add(Model, null, null, { string: [] });
      }, (err) => {
        const msg = 'The attachs structure is key = > value, value must be a string';
        return err instanceof Error && err.message === msg;
      });

      done();
    });
  });
  describe('All aguments validate passed', () => {
    it('normal cols set, hook set', (done) => {
      const add = helper.add(Model, ['name', 'age'], 'user', { address: 'hooks.address' });

      const req = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
        send(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Jason Bai',
            age: 36,
            address: '北京市昌平区',
          }, data);
        },
      };

      add(req, res, (error) => {
        try {
          assert.equal(null, error);

          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('normal cols set, hook unset', (done) => {
      const add = helper.add(Model, ['name', 'age'], null, { address: 'hooks.address' });

      const req = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
        send(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Jason Bai',
            age: 36,
            address: '北京市昌平区',
          }, data);
        },
      };

      add(req, res, (error) => {
        try {
          assert.equal(null, error);

          done();
        } catch (e) {
          done(e);
        }
      });
    });

    it('Has error when beforeAdd', (done) => {
      const add = helper.add(Model, ['name', 'age'], null, { address: 'hooks.address' });

      const req = {
        hooks: {
          address: '北京市昌平区',
        },
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
        send(statusCode, data) {
          assert.equal(201, statusCode);
          assert.deepEqual({
            id: 1,
            name: 'Jason Bai',
            age: 36,
            address: '北京市昌平区',
          }, data);
        },
      };

      Model.build = attrs => (
        _.extend({}, attrs, {
          save() {
            return new Promise((resolve, reject) => {
              setTimeout(() => {
                reject(Error('Hello world'));
              }, 10);
            });
          },
        })
      );

      add(req, res, (error) => {
        try {
          assert.equal('Hello world', error.message);
          assert.ok(error instanceof Error);

          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
