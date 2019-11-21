const host = process.env.ES_HOSt || '127.0.0.1';
const port = process.env.ES_PORT || 9200;

module.exports = {
  elastic: {
    node: `http://${host}:${port}`,
    maxRetries: 3,
    requestTimeout: 30000,
  },
};
