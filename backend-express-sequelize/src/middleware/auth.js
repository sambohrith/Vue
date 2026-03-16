const jwt = require('jsonwebtoken');
const User = require('../modules/user/models/User');
const { AppError } = require('./errorHandler');
const logger = require('./logger');

const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      logger.logAuth('authenticate', null, false, { ip: req.ip, path: req.path });
      throw new AppError('未提供访问令牌，请先登录', 401);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findByPk(decoded.userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        logger.logAuth('authenticate', decoded.userId, false, { ip: req.ip, path: req.path, reason: '用户不存在' });
        throw new AppError('令牌对应的用户不存在', 401);
      }

      if (!user.isActive) {
        logger.logAuth('authenticate', user.id, false, { ip: req.ip, path: req.path, reason: '账户已被禁用' });
        throw new AppError('账户已被禁用，请联系管理员', 401);
      }

      logger.logAuth('authenticate', user.id, true, { ip: req.ip, path: req.path });
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        logger.logAuth('authenticate', null, false, { ip: req.ip, path: req.path, reason: '令牌已过期' });
        throw new AppError('令牌已过期，请重新登录', 401);
      }
      if (error.name === 'JsonWebTokenError') {
        logger.logAuth('authenticate', null, false, { ip: req.ip, path: req.path, reason: '无效的令牌' });
        throw new AppError('无效的令牌，请重新登录', 401);
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.logAuth('authorize', null, false, { ip: req.ip, path: req.path, roles, reason: '未认证' });
      return next(new AppError('未认证，请先登录', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.logAuth('authorize', req.user.id, false, { ip: req.ip, path: req.path, roles, userRole: req.user.role, reason: '权限不足' });
      return next(new AppError('您没有权限执行此操作', 403));
    }

    logger.logAuth('authorize', req.user.id, true, { ip: req.ip, path: req.path, roles });
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
          attributes: { exclude: ['password'] }
        });

        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
      }
    }

    next();
  } catch (error) {
    next();
  }
};

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  generateToken,
  verifyToken
};
