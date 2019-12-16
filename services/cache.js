const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");
const keys = require("../config/keys");

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

// reference of the mongoose's original 'exec' function
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  // we JSON.stringify the key property just in case someone passes array, or number on 'accident'
  // || operator assigns empty string just in case there's no 'key' parameter passed inside
  this.hashKey = JSON.stringify(options.key || "");

  // to make it chainable (cache().limit(1),...)
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // check if key is in redis, return if true
  // create unique key
  const uniqueKey = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name
  });

  // or...
  //   const uniqueKey = Object.assign({}, this.getQuery(), {
  //     collection: this.mongooseCollection.name
  //   });

  const cacheValue = await client.hget(this.hashKey, uniqueKey);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);
    // check if cache value is array or single doc and change it to mongoose model
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  const result = await exec.apply(this, arguments);
  //   // save to redis
  client.hset(this.hashKey, uniqueKey, JSON.stringify(result), "EX", 10);
  //   // exec original query and return result
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
