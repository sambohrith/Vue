const { auth, optionalAuth, roleAuth } = require('./auth');
const { errorHandler, notFound, recovery } = require('./error');
const { createRateLimiter } = require('./rateLimit');
const { requestId } = require('./requestId');

module.exports = {
  auth,
  optionalAuth,
  roleAuth,
  errorHandler,
  notFound,
  recovery,
  createRateLimiter,
  requestId
};
