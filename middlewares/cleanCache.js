const { clearHash } = require("../services/cache");

module.exports = async (req, res, next) => {
  // await 'wait' for the route handler to do it's job and than continue to this middleware
  await next();

  // after saving to the mongoDB clear the cache to that key
  clearHash(req.user.id);
};
