const assert = require('assert');
const rest = require('open-rest');
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
};

/* global describe it */
describe('open-rest-helper-elastic-modify', () => {
  describe('Argument validate error', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, {});
      }, (err) => {
        const msg = 'Will modify instance hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', 'string');
      }, err => err instanceof Error && err.message === "Allow modify attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.modify(Model, 'user', ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal changed', (done) => {
      const modify = helper.modify(Model, 'user', ['name']);

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Jason Bai',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: 1,
                    name: 'Jason Bai',
                    age: 36,
                  });
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
        },
      };

      const res = {
        send(data) {
          assert.deepEqual({
            id: 1,
            name: 'Jason Bai',
            age: 36,
          }, data);
        },
      };

      modify(req, res, (error) => {
        assert.equal(null, error);

        done();
      });
    });

    it('normal unchanged', (done) => {
      const modify = helper.modify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Jason Bai',
            age: 36,
            changed() {
              return false;
            },
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
        },
      };

      /* eslint no-underscore-dangle: 0 */
      const res = {
        send(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        },
      };

      modify(req, res, (error) => {
        assert.equal(null, error);

        done();
      });
    });

    it('Has error when save', (done) => {
      const modify = helper.modify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Jason Bai',
            age: 36,
            changed() {
              return ['name'];
            },
            save(option) {
              assert.deepEqual({
                fields: ['name'],
              }, option);
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(Error('Hello world'));
                }, 20);
              });
            },
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
        },
      };

      const res = {
        send(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        },
      };

      modify(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });
    });

    it('Has error when beforeModify', (done) => {
      const modify = helper.modify(Model, 'user', ['name', 'age']);

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Jason Bai',
            age: 36,
            changed() {
              return ['name'];
            },
            save() {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(new Error('Has error when save'));
                }, 10);
              });
            },
          },
        },
      };

      const res = {
        send(data) {
          assert.equal(req.hooks.user, data);
          assert.equal(true, req._resourceNotChanged);
        },
        header(key, value) {
          assert.equal('X-Content-Resource-Status', key);
          assert.equal('Unchanged', value);
        },
      };

      modify(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Has error when save', error.message);

        done();
      });
    });
  });
});
