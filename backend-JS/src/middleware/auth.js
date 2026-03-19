const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { logger } = require('../utils/logger');

const generateToken = (userId) => {
  const expiration = config.jwt.expiration;
  let expiresIn = '24h';
  
  if (expiration.endsWith('h')) {
    expiresIn = expiration;
  } else if (expiration.endsWith('d')) {
    const days = parseInt(expiration);
    expiresIn = `${days * 24}h`;
  }
  
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: '认证格式错误'
      });
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: '无效的令牌'
      });
    }

    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    return res.status(401).json({
      success: false,
      message: '认证失败'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next();
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next();
    }

    const user = await User.findByPk(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }
    
    next();
  } catch (error) {
    next();
  }
};

const roleAuth = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    logger.info(`权限检查 - 用户: ${req.user.username}, 角色: ${req.userRole}, 路径: ${req.path}`);

    if (!req.userRole || roles.includes(req.userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: '权限不足'
    });
  };
};

module.exports = {
  generateToken,
  verifyToken,
  auth,
  optionalAuth,
  roleAuth
};
