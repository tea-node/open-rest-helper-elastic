const assert = require('assert');
const sortBy = require('lodash/sortBy');
const keys = require('lodash/keys');
const includes = require('lodash/includes');
const each = require('lodash/each');
const rest = require('open-rest');
const { elastic } = require('./app/configs');
const model = require('../lib/model');

const { utils } = rest;

/* global describe it */
describe('lib/model', () => {
  describe('#init', () => {
    const errorLog = utils.logger.error;
    let getModel;
    utils.logger.error = () => {};

    it('model dir non-exists', (done) => {
      getModel = model(elastic, `${__dirname}/models-non-exists`, rest);
      assert.ok(getModel instanceof Function);

      done();
    });

    it('model dir exists', (done) => {
      getModel = model(elastic, `${__dirname}/app`, rest);
      assert.ok(getModel instanceof Function);
      done();
    });

    it('check model', (done) => {
      assert.ok(getModel('user'));
      assert.deepEqual(['user'], sortBy(keys(getModel())));
      done();
    });

    it('type-sync ENV is development', (done) => {
      const NODE_ENV = process.env.NODE_ENV;
      const infoLog = utils.logger.info;

      process.env.NODE_ENV = 'development';

      each(getModel(), (Model) => {
        Model.sync = () => (
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(Model.name);
            }, 10);
          })
        );
      });

      utils.logger.info = (synced, table) => {
        assert.equal('Synced', synced);
        assert.ok(includes(['user'], table));
      };

      process.argv.push('type-sync');

      model(elastic, `${__dirname}/app`, rest);

      utils.logger.info = infoLog;
      process.env.NODE_ENV = NODE_ENV;
      process.argv.pop();

      done();
    });

    it('type-sync ENV is development, exclude type-sync in argv', (done) => {
      const NODE_ENV = process.env.NODE_ENV;
      const infoLog = utils.logger.info;

      process.env.NODE_ENV = 'development';
      model(elastic, `${__dirname}/app`, rest);

      utils.logger.info = infoLog;
      process.env.NODE_ENV = NODE_ENV;

      done();
    });

    it('elastic is null', (done) => {
      getModel = model(null, `${__dirname}/app`, rest);
      assert.ok(getModel instanceof Function);
      assert.deepEqual({}, getModel());
      done();
    });

    it('reset ENV isnt production', (done) => {
      getModel = model(elastic, `${__dirname}/app`, rest);
      assert.ok(getModel.reset instanceof Function);
      assert.equal(1, keys(getModel()).length);

      getModel.reset();
      assert.equal(0, keys(getModel()).length);

      done();
    });

    it('reset ENV is production', (done) => {
      rest.utils.isProd = true;
      getModel.reset();
      getModel = model(elastic, `${__dirname}/app`, rest);
      assert.equal(null, getModel.reset);
      assert.equal(1, keys(getModel()).length);

      done();
    });

    it('done path is null', (done) => {
      utils.logger.error = () => {};
      getModel = model(elastic, null, rest);
      assert.ok(getModel instanceof Function);
      assert.deepEqual({}, getModel());
      utils.logger.error = errorLog;
      done();
    });
  });
});
