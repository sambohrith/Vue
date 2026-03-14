// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error('Error:', err);

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `该${getFieldName(field)}已被使用`;
    error = { message, field };
    return res.status(400).json({
      success: false,
      message,
      field,
    });
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: messages,
    });
  }

  // Mongoose 无效ObjectId
  if (err.name === 'CastError') {
    const message = `无效的${getFieldName(err.path)}`;
    return res.status(400).json({
      success: false,
      message,
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的令牌',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '令牌已过期，请重新登录',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
  });
};

// 字段名映射
const getFieldName = (field) => {
  const fieldNames = {
    username: '用户名',
    email: '邮箱',
    'workInfo.employeeId': '工号',
    phone: '手机号',
    idCard: '身份证号',
  };
  return fieldNames[field] || field;
};

// 异步错误处理包装器
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
