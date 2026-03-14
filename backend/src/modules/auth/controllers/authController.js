const User = require('../../user/models/User');
const { Op } = require('sequelize');
const { generateToken } = require('../../../config/auth');
const { asyncHandler } = require('../../../middleware/errorHandler');

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;

  // 检查邮箱是否已存在
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }]
    }
  });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: existingUser.email === email ? '该邮箱已被注册' : '该用户名已被使用',
    });
  }

  // 创建新用户
  const user = await User.create({
    username,
    email,
    password,
    fullName: fullName || username,
  });

  // 生成令牌
  const token = generateToken(user.id);

  res.status(201).json({
    success: true,
    message: '注册成功',
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  console.log('登录请求:', { username, passwordLength: password?.length });

  // 只支持用户名登录
  if (!username) {
    return res.status(400).json({
      success: false,
      message: '请输入用户名',
    });
  }

  // 查找用户（只通过用户名，需要包含密码字段）
  const user = await User.scope('withPassword').findOne({
    where: { username }
  });

  console.log('查找到用户:', user ? { id: user.id, username: user.username, isActive: user.isActive } : '未找到');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: '账号或密码错误',
    });
  }

  // 检查账户是否被禁用
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: '账户已被禁用，请联系管理员',
    });
  }

  // 验证密码
  console.log('数据库密码哈希:', user.password?.substring(0, 30) + '...');
  const isPasswordValid = await user.comparePassword(password);
  console.log('密码验证结果:', isPasswordValid);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: '账号或密码错误',
    });
  }

  // 更新登录信息
  await user.updateLoginInfo();

  // 生成令牌
  const token = generateToken(user.id);

  res.json({
    success: true,
    message: '登录成功',
    data: {
      user: user.toPublicJSON(),
      token,
    },
  });
});

// @desc    获取当前用户信息
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.json({
    success: true,
    data: {
      user: user.toPublicJSON(),
    },
  });
});

// @desc    修改密码
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // 获取用户（需要包含密码字段）
  const user = await User.scope('withPassword').findByPk(req.user.id);

  // 验证当前密码
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: '当前密码错误',
    });
  }

  // 更新密码
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: '密码修改成功',
  });
});

// @desc    刷新令牌
// @route   POST /api/auth/refresh-token
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const token = generateToken(req.user.id);

  res.json({
    success: true,
    data: {
      token,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
  changePassword,
  refreshToken,
};
