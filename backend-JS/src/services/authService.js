const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { authLogger, logger } = require('../utils/logger');

const register = async (req) => {
  const { username, email, password, fullName } = req;

  const existingUser = await User.findOne({
    where: {
      $or: [{ username }, { email }]
    }
  });

  if (existingUser) {
    throw new Error('用户名或邮箱已被使用');
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName: fullName || username,
    role: 'user',
    isActive: true
  });

  const token = generateToken(user.id);

  authLogger('register', user.id, true);

  return {
    user: user.toPublicJSON(),
    token
  };
};

const login = async (req, clientIP) => {
  const { username, password } = req;

  const user = await User.findOne({ where: { username } });

  if (!user) {
    authLogger('login', 0, false, { username, reason: '用户不存在', ip: clientIP });
    throw new Error('账号或密码错误');
  }

  if (!user.isActive) {
    authLogger('login', user.id, false, { username, reason: '账户已被禁用', ip: clientIP });
    throw new Error('账户已被禁用，请联系管理员');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    authLogger('login', user.id, false, { username, reason: '密码错误', ip: clientIP });
    throw new Error('账号或密码错误');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user.id);

  authLogger('login', user.id, true, { username, ip: clientIP });

  return {
    user: user.toPublicJSON(),
    token
  };
};

const logout = async (userId, clientIP) => {
  authLogger('logout', userId, true, { ip: clientIP });
  return { success: true };
};

const changePassword = async (userId, req, clientIP) => {
  const { currentPassword, newPassword } = req;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('用户不存在');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new Error('当前密码不正确');
  }

  user.password = newPassword;
  await user.save();

  authLogger('changePassword', userId, true, { ip: clientIP });
  return { success: true };
};

const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return user.toPublicJSON();
};

const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('用户不存在');
  }
  return user.toProfileJSON();
};

const refreshToken = async (token) => {
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error('无效的令牌');
  }

  const user = await User.findByPk(decoded.userId);
  if (!user || !user.isActive) {
    throw new Error('用户不存在或已被禁用');
  }

  const newToken = generateToken(user.id);
  return {
    user: user.toPublicJSON(),
    token: newToken
  };
};

module.exports = {
  register,
  login,
  logout,
  changePassword,
  getCurrentUser,
  getUserProfile,
  refreshToken
};
