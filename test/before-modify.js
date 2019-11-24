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
describe('open-rest-helper-elastic-beforeModify', () => {
  describe('Argument validate error', () => {
    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, {});
      }, (err) => {
        const msg = 'Will modify instance hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', 'string');
      }, err => err instanceof Error && err.message === "Allow modify attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.beforeModify(Model, 'user', ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal cols set', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user', ['name']);

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
        },
      };

      const res = {
      };

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });

    it('cols unset, editableCols exists', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
      };

      Model.editableCols = ['name', 'age'];

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });

    it('cols unset, editableCols non-exists, writableCols exists', (done) => {
      const beforeModify = helper.beforeModify(Model, 'user');

      const req = {
        hooks: {
          user: {
            id: 1,
            name: 'Redstone',
            age: 36,
          },
        },
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
      };

      Model.editableCols = null;
      Model.writableCols = ['name', 'age'];

      beforeModify(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });
  });
});
