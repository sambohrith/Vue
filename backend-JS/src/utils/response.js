const formatTime = (date = null) => {
  const d = date || new Date();
  return d.toISOString().replace('T', ' ').substring(0, 19);
};

const success = (res, data, message = '操作成功') => {
  return res.json({
    success: true,
    message,
    data,
    timestamp: formatTime()
  });
};

const created = (res, data, message = '创建成功') => {
  return res.status(201).json({
    success: true,
    message,
    data,
    timestamp: formatTime()
  });
};

const error = (res, statusCode = 400, message = '操作失败') => {
  return res.status(statusCode).json({
    success: false,
    message,
    timestamp: formatTime()
  });
};

const validationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: '数据验证失败',
    errors,
    timestamp: formatTime()
  });
};

const paginated = (res, data, total, page, limit, message = '获取成功') => {
  const totalPages = Math.ceil(total / limit);
  return res.json({
    success: true,
    message,
    data: {
      ...data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    },
    timestamp: formatTime()
  });
};

module.exports = {
  formatTime,
  success,
  created,
  error,
  validationError,
  paginated
};
