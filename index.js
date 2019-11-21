const ElasticSearch = require('@elastic/elasticsearch');
const model = require('./lib/model');

const Init = (rest, path) => {
  const { elastic } = rest.utils.require(`${path}/configs`) || {};

  /** 释放 ElasticSearch 和 Client */
  rest.ElasticSearch = ElasticSearch;

  /**
    * model 的 初始化
    * 将获取Model类的方法注册到rest.utils上
    */
  rest.utils.elastic = model(elastic, path, rest);

  return rest.utils.elastic;
};

Init.ElasticSearch = ElasticSearch;

module.exports = Init;
