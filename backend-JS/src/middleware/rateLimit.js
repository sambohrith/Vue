const rateLimit = require('express-rate-limit');
const config = require('../config');

const createRateLimiter = () => {
  if (!config.rateLimit.enabled) {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: 60 * 1000,
    max: config.rateLimit.requestsPerMinute,
    burst: config.rateLimit.burst,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/api/health' || req.path === '/api/health/detailed';
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
        timestamp: new Date().toISOString()
      });
    }
  });
};

module.exports = {
  createRateLimiter
};
