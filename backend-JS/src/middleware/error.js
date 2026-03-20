const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('请求处理错误:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的接口不存在',
    timestamp: new Date().toISOString()
  });
};

const recovery = (err, req, res, next) => {
  logger.error('服务器发生异常:', err);
  
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  errorHandler,
  notFound,
  recovery
};
