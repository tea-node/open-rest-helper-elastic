
const assert = require('assert');
const rest = require('open-rest');
const extend = require('lodash/extend');

const helper = require('../')(rest);

const Model = {
  rawAttributes: {
    id: {
      type: 'long',
    },
    name: {
      type: 'string',
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
    };
  },
  findOne() {
    return {};
  },
};

/* global describe it */
describe('open-rest-helper-elastic-beforeAdd', () => {
  describe('Argument validate error', () => {
    it('Model argument unset', (done) => {
      assert.throws(() => {
        helper.beforeAdd();
      }, (err) => {
        const msg = 'Model must be has findOne and build functions';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model is empty object', (done) => {
      assert.throws(() => {
        helper.beforeAdd({});
      }, (err) => {
        const msg = 'Model.build must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.build not a function', (done) => {
      assert.throws(() => {
        helper.beforeAdd({
          build: {},
        });
      }, (err) => {
        const msg = 'Model.build must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.save not a function', (done) => {
      assert.throws(() => {
        helper.beforeAdd({
          build: () => {},
          save: 1,
        });
      }, (err) => {
        const msg = 'Model.save must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('Model.findOne not a function', (done) => {
      assert.throws(() => {
        helper.beforeAdd({
          build: () => {},
          save: () => {},
          findOne: 1,
        });
      }, (err) => {
        const msg = 'Model.findOne must be a function';
        return err instanceof Error && err.message === msg;
      });
      done();
    });

    it('cols type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, 'string');
      }, err => err instanceof Error && err.message === "Allow writed attrs's name array");
      done();
    });

    it('cols item type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, [null]);
      }, err => err instanceof Error && err.message === 'Every item in cols must be a string.');
      done();
    });

    it('cols item non-exists error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, ['id', 'price']);
      }, err => err instanceof Error && err.message === 'Attr non-exists: price');
      done();
    });

    it('hook argument type error', (done) => {
      assert.throws(() => {
        helper.beforeAdd(Model, null, {});
      }, (err) => {
        const msg = 'Added instance will hook on req.hooks[hook], so `hook` must be a string';
        return err instanceof Error && err.message === msg;
      });
      done();
    });
  });

  describe('All aguments validate passed', () => {
    it('normal cols set, hook set', (done) => {
      const beforeAdd = helper.beforeAdd(Model, ['name', 'age'], 'user');
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
      };

      const res = {
      };

      beforeAdd(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          age: 36,
        }, req.hooks.user);

        done();
      });
    });
    it('normal cols unset, hook set, creatorId, clientIp', (done) => {
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
        user: {
          id: 99999,
          name: '白宇',
        },
        headers: {
          'x-forwarded-for': '192.168.199.199',
        },
      };

      const res = {
      };

      const Model1 = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'string',
          },
          age: {
            type: 'long',
          },
          creatorId: {
            type: 'keyword',
          },
          clientIp: {
            type: 'keyword',
          },
        },
        writableCols: ['name', 'age'],
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
            creatorId: 99999,
            clientIp: '192.168.199.199',
          };
        },
        findOne() {
          return {};
        },
      };

      const beforeAdd = helper.beforeAdd(Model1, null, 'user');

      beforeAdd(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          age: 36,
          creatorId: 99999,
          clientIp: '192.168.199.199',
        }, req.hooks.user);

        done();
      });
    });

    it('Has error when save', (done) => {
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          age: 36,
        },
        user: {
          id: 99999,
          name: '白宇',
        },
        headers: {
          'x-forwarded-for': '192.168.199.199',
        },
      };

      const res = {
      };

      const Model1 = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'string',
          },
          age: {
            type: 'long',
          },
          creatorId: {
            type: 'keyword',
          },
          clientIp: {
            type: 'keyword',
          },
        },
        writableCols: ['name', 'age'],
        build(attrs) {
          return extend({}, attrs, {
            save() {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(Error('Hello world'));
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
            creatorId: 99999,
            clientIp: '192.168.199.199',
          };
        },
        findOne() {
          return {};
        },
      };

      const beforeAdd = helper.beforeAdd(Model1, null, 'user');

      beforeAdd(req, res, (error) => {
        assert.ok(error instanceof Error);
        assert.equal('Hello world', error.message);

        done();
      });
    });

    it('set unique isDelete non-exists', (done) => {
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        headers: {
          'x-forwarded-for': '192.168.199.199',
        },
      };

      const res = {
      };

      const Model1 = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'keyword',
          },
          age: {
            type: 'long',
          },
          creatorId: {
            type: 'keyword',
          },
          clientIp: {
            type: 'keyword',
          },
          isDelete: {
            type: 'no',
          },
        },
        writableCols: ['name', 'age', 'email'],
        unique: ['name', 'email'],
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
            creatorId: 99999,
            clientIp: '192.168.199.199',
          };
        },
        findOne(option) {
          assert.deepEqual({
            query: {
              bool: {
                must: [{
                  term: {
                    name: 'Jason Bai',
                  },
                }, {
                  term: {
                    email: '602316022@qq.com',
                  },
                }],
              },
            },
            size: 1,
          }, option.where);

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve();
            }, 10);
          });
        },
      };

      const beforeAdd = helper.beforeAdd(Model1, null, 'user');

      beforeAdd(req, res, (error) => {
        assert.equal(null, error);
        assert.deepEqual({
          id: 1,
          name: 'Jason Bai',
          email: '602316022@qq.com',
          age: 36,
          creatorId: 99999,
          clientIp: '192.168.199.199',
        }, req.hooks.user);

        done();
      });
    });

    it('set unique isDelete exists, isDelete=no', (done) => {
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        headers: {
          'x-forwarded-for': '192.168.199.199',
        },
      };

      const res = {
      };

      const Model1 = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'keyword',
          },
          age: {
            type: 'long',
          },
          creatorId: {
            type: 'keyword',
          },
          clientIp: {
            type: 'keyword',
          },
          isDelete: {
            type: 'no',
          },
        },
        writableCols: ['name', 'age', 'email'],
        unique: ['name', 'email'],
        build(attrs) {
          return extend({}, attrs, {});
        },
        save() {
          return {
            id: 1,
            name: 'Jason Bai',
            age: 36,
            creatorId: 99999,
            clientIp: '192.168.199.199',
          };
        },
        findOne(option) {
          assert.deepEqual({
            query: {
              bool: {
                must: [{
                  term: {
                    name: 'Jason Bai',
                  },
                }, {
                  term: {
                    email: '602316022@qq.com',
                  },
                }],
              },
            },
            size: 1,
          }, option.where);

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                id: 1,
                name: 'Jason Bai',
                email: '602316022@qq.com',
                age: 35,
                creatorId: 99999,
                clientIp: '192.168.199.199',
                isDelete: 'no',
                save() {
                  return new Promise((resol) => {
                    setTimeout(() => {
                      resol({
                        id: 1,
                        name: 'Jason Bai',
                        email: '602316022@qq.com',
                        age: 36,
                        creatorId: 99999,
                        clientIp: '192.168.199.199',
                        isDelete: 'no',
                      });
                    }, 10);
                  });
                },
              });
            }, 10);
          });
        },
      };

      const beforeAdd = helper.beforeAdd(Model1, null, 'user');

      beforeAdd(req, res, (error) => {
        try {
          assert.deepEqual([{
            message: 'Resource exists.',
            path: 'name',
          }], error.message);
          assert.ok(error instanceof Error);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
    it('set unique isDelete exists, isDelete=yes', (done) => {
      const req = {
        hooks: {},
        params: {
          id: 99,
          name: 'Jason Bai',
          email: '602316022@qq.com',
          age: 36,
        },
        user: {
          id: 99999,
          name: '赵雄飞',
        },
        headers: {
          'x-forwarded-for': '192.168.199.199',
        },
      };

      const res = {
      };

      const Model1 = {
        rawAttributes: {
          id: {
            type: 'long',
          },
          name: {
            type: 'string',
          },
          email: {
            type: 'keyword',
          },
          age: {
            type: 'long',
          },
          creatorId: {
            type: 'keyword',
          },
          clientIp: {
            type: 'keyword',
          },
          isDelete: {
            type: 'no',
          },
        },
        writableCols: ['name', 'age', 'email'],
        unique: ['name', 'email'],
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
            creatorId: 99999,
            clientIp: '192.168.199.199',
          };
        },
        findOne(option) {
          assert.deepEqual({
            query: {
              bool: {
                must: [{
                  term: {
                    name: 'Jason Bai',
                  },
                }, {
                  term: {
                    email: '602316022@qq.com',
                  },
                }],
              },
            },
            size: 1,
          }, option.where);

          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                id: 1,
                name: 'Jason Bai',
                email: '602316022@qq.com',
                age: 36,
                creatorId: 99999,
                clientIp: '192.168.199.199',
                isDelete: 'yes',
                save() {
                  return new Promise((resol) => {
                    setTimeout(() => {
                      resol({
                        id: 1,
                        name: 'Jason Bai',
                        email: '602316022@qq.com',
                        age: 36,
                        creatorId: 99999,
                        clientIp: '192.168.199.199',
                        isDelete: 'no',
                      });
                    }, 10);
                  });
                },
              });
            }, 10);
          });
        },
      };

      const beforeAdd = helper.beforeAdd(Model1, null, 'user');

      beforeAdd(req, res, (error) => {
        try {
          assert.equal(null, error);
          assert.deepEqual({
            id: 1,
            name: 'Jason Bai',
            email: '602316022@qq.com',
            age: 36,
            creatorId: 99999,
            isDelete: 'no',
            clientIp: '192.168.199.199',
          }, req.hooks.user);
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
