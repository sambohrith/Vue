const NodeCache = require('node-cache');

const cache = new NodeCache({
  stdTTL: 300, // 默认缓存时间 5分钟
  checkperiod: 60, // 检查过期时间的间隔 1分钟
  maxKeys: 10000 // 最大缓存键数量
});

const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = cache.get(key);
    
    if (cachedBody) {
      res.send(cachedBody);
      return;
    }
    
    res.sendResponse = res.send;
    res.send = (body) => {
      if (res.statusCode === 200) {
        cache.set(key, body, duration);
      }
      res.sendResponse(body);
    };
    
    next();
  };
};

const cacheManager = {
  get: (key) => {
    return cache.get(key);
  },
  set: (key, value, ttl = 300) => {
    return cache.set(key, value, ttl);
  },
  del: (key) => {
    return cache.del(key);
  },
  delByPattern: (pattern) => {
    const keys = cache.keys();
    const matchedKeys = keys.filter(key => key.match(pattern));
    return cache.del(matchedKeys);
  },
  clear: () => {
    return cache.flushAll();
  },
  getStats: () => {
    return cache.getStats();
  }
};

const invalidateCache = (pattern) => {
  cacheManager.delByPattern(pattern);
};

module.exports = {
  cacheMiddleware,
  cacheManager,
  invalidateCache
};
