const User = require('../../user/models/User');
const { Op } = require('sequelize');
const { generateToken } = require('../../../middleware/auth');
const { asyncHandler, AppError } = require('../../../middleware/errorHandler');
const logger = require('../../../middleware/logger');

const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });

  if (existingUser) {
    throw new AppError(
      existingUser.email === email ? '该邮箱已被注册' : '该用户名已被使用',
      400
    );
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName: fullName || username,
  });

  const token = generateToken(user.id);

  logger.logAuth('register', user.id, true, { ip: req.ip });

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    throw new AppError('请输入用户名', 400);
  }

  const user = await User.scope('withPassword').findOne({
    where: { username }
  });

  if (!user) {
    logger.logAuth('login', null, false, { ip: req.ip, username, reason: '用户不存在' });
    throw new AppError('账号或密码错误', 401);
  }

  if (!user.isActive) {
    logger.logAuth('login', user.id, false, { ip: req.ip, username, reason: '账户已被禁用' });
    throw new AppError('账户已被禁用，请联系管理员', 401);
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    logger.logAuth('login', user.id, false, { ip: req.ip, username, reason: '密码错误' });
    throw new AppError('账号或密码错误', 401);
  }

  await user.updateLoginInfo();

  const token = generateToken(user.id);

  logger.logAuth('login', user.id, true, { ip: req.ip, username });

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  logger.logAuth('logout', req.user.id, true, { ip: req.ip });
  
  res.json({
    success: true,
    message: '登出成功'
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  const user = await User.scope('withPassword').findByPk(userId);

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  const isPasswordValid = await user.comparePassword(currentPassword);

  if (!isPasswordValid) {
    throw new AppError('当前密码不正确', 400);
  }

  user.password = newPassword;
  await user.save();

  logger.logAuth('changePassword', user.id, true, { ip: req.ip });

  res.json({
    success: true,
    message: '密码修改成功',
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toPublicJSON(),
    },
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  changePassword,
  getCurrentUser,
};
