const { ValidationError } = require('sequelize');
const jwt = require('jsonwebtoken');
const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });
  }

  logger.logError(err, req);

  if (err.name === 'SequelizeValidationError' || err instanceof ValidationError) {
    const messages = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: messages
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = Object.keys(err.fields)[0];
    const message = `该${getFieldName(field)}已被使用`;
    return res.status(400).json({
      success: false,
      message,
      field
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在，无法完成操作'
    });
  }

  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      message: '数据库操作失败'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期，请重新登录'
    });
  }

  if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: '请求数据格式错误'
    });
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  logger.warn(`请求的接口不存在: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.status(404).json({
    success: false,
    message: `请求的接口 ${req.method} ${req.path} 不存在`
  });
};

const getFieldName = (field) => {
  const fieldNames = {
    username: '用户名',
    email: '邮箱',
    employeeId: '工号',
    phone: '手机号',
    idCard: '身份证号',
    name: '名称'
  };
  return fieldNames[field] || field;
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError
};
