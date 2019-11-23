const assert = require('assert');
const rest = require('open-rest');

const helper = require('../')(rest);

const Model = {
  rawAttributes: {
    id: {
      type: 'long',
    },
  },

  count(options) {
    assert.deepEqual(options.where,
      {
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
        from: 100,
        size: 100,
      });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(2);
      }, 100);
    });
  },

  findAll(options) {
    const ls = [{
      id: 1,
      name: 'Jason Bai',
      score: 30,
    }, {
      id: 2,
      name: 'Bai Jasons',
      score: 60,
    }];
    return new Promise((resolve) => {
      assert.deepEqual(options.where,
        {
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
          from: 100,
          size: 100,
        });
      setTimeout(() => {
        resolve(ls);
      }, 100);
    });
  },
};
/* global describe it */
describe('open-rest-helper-elastic-list', () => {
  describe('list', () => {
    it('Model argument type error', (done) => {
      assert.throws(() => {
        helper.list({});
      }, (err) => {
        const msg = 'Model.count must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.count not a function', (done) => {
      assert.throws(() => {
        helper.list({
          count: {},
        });
      }, (err) => {
        const msg = 'Model.count must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.findAll not found', (done) => {
      assert.throws(() => {
        helper.list({
          count: () => 0,
        });
      }, (err) => {
        const msg = 'Model.findAll must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.findAll not a function', (done) => {
      assert.throws(() => {
        helper.list({
          count: () => 0,
          findAll: {},
        });
      }, (err) => {
        const msg = 'Model.findAll must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('opt argument type error', (done) => {
      assert.throws(() => {
        helper.list(Model, {});
      }, (err) => {
        const msg = "FindAll option hooks's name, so `opt` must be a string";
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('allowAttrs type error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, 'string');
      }, err => err instanceof Error && err.message === "Allow return attrs's name array");
      done();
    });

    it('allowAttrs item type error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, [null]);
      }, (err) => {
        const msg = 'Every item in allowAttrs must be a string.';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('allowAttrs item non-exists error', (done) => {
      assert.throws(() => {
        helper.list(Model, null, ['price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });

    it('fixOptFn is function', (done) => {
      const fixOptFn = (options, params) => {
        const { startIndex, maxResults } = params;
        options.where.from = startIndex;
        options.where.size = maxResults;
      };

      const list = helper
        .list
        .Model(Model)
        .fixOptFn(fixOptFn)
        .exec();

      const req = {
        params: {
          startIndex: 100,
          maxResults: 100,
        },
      };

      const res = {
        send(lss) {
          assert.deepEqual([{
            id: 1,
            name: 'Jason Bai',
            score: 30,
          }, {
            id: 2,
            name: 'Bai Jasons',
            score: 60,
          }], lss);
        },

        header(key, value) {
          assert.equal('X-Content-Record-Total', key);
          assert.equal(2, value);
        },
      };

      list(req, res, (error) => {
        assert.equal(null, error);
        done();
      });
    });
  });
});
