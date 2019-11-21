const assert = require('assert');
const rest = require('open-rest');
const restWithElastic = require('../');

/* global describe it */
describe('integrate', () => {
  describe('#inited', () => {
    let elastic = restWithElastic(rest, `${__dirname}/app`);

    it('helper init completed', (done) => {
      assert.ok(rest.utils.elastic instanceof Function);
      assert.ok(rest.utils.elastic('user'));

      assert.ok(elastic('user'));

      assert.deepEqual(elastic('user').mappings, {
        mappings: {
          properties: {
            kw_id: {
              type: 'keyword',
            },
            text_name: {
              type: 'text',
            },
            kw_avatar: {
              type: 'keyword',
            },
          },
        },
      });

      assert.ok(rest.ElasticSearch);
      assert.ok(restWithElastic.ElasticSearch);

      done();
    });

    it('mappings non-existed', (done) => {
      elastic = restWithElastic(rest, `${__dirname}/not-found-mappings`);

      assert.ok(rest.utils.elastic instanceof Function);
      assert.ok(rest.utils.elastic('user'));

      assert.ok(elastic('user'));

      assert.equal(elastic('user').mappings, null);

      assert.ok(rest.ElasticSearch);
      assert.ok(restWithElastic.ElasticSearch);

      done();
    });


    it('configs non-existed', (done) => {
      elastic = restWithElastic(rest, `${__dirname}`);

      assert.ok(rest.utils.elastic instanceof Function);
      assert.equal(null, rest.utils.elastic('user'));

      assert.ok(rest.ElasticSearch);
      assert.ok(restWithElastic.ElasticSearch);

      done();
    });
  });
});
