const jwt = require('jsonwebtoken');
const User = require('../modules/user/models/User');

// 验证JWT令牌
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 从请求头中获取令牌
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 检查令牌是否存在
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供访问令牌，请先登录',
      });
    }

    try {
      // 验证令牌
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 查找用户
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '令牌对应的用户不存在',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用，请联系管理员',
        });
      }

      // 将用户信息附加到请求对象
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '无效的令牌，请重新登录',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      error: error.message,
    });
  }
};

// 验证管理员权限
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您没有权限执行此操作',
      });
    }
    next();
  };
};

// 可选认证（用于某些公开接口）
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // 忽略验证错误，继续作为未认证用户
      }
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
