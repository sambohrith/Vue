const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');

const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: '请求过于频繁，请稍后再试'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health'
  };

  return rateLimit({ ...defaultOptions, ...options });
};

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: '尝试次数过多，请15分钟后再试'
  }
});

const chatLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: '发送消息过于频繁，请稍后再试'
  }
});

const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

const requestSizeLimit = {
  json: '10mb',
  urlencoded: '10mb'
};

const securityMiddleware = {
  helmet: helmet(helmetConfig),
  requestSizeLimit,
  xss: xss(),
  hpp: hpp({
    whitelist: ['page', 'limit', 'sort', 'fields']
  }),
  apiLimiter,
  strictLimiter,
  chatLimiter,
  createRateLimiter
};

module.exports = securityMiddleware;
