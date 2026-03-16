const User = require('../models/User');
const { Op } = require('sequelize');
const { asyncHandler, AppError } = require('../../../middleware/errorHandler');

const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    role = '',
    isActive = ''
  } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { username: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } }
    ];
  }
  if (role) where.role = role;
  if (isActive !== '') where.isActive = isActive === 'true';

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows: users } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    }
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  res.json({
    success: true,
    data: { user }
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, fullName, department, position } = req.body;

  const existingUser = await User.findOne({
    where: { [Op.or]: [{ username }, { email }] }
  });

  if (existingUser) {
    throw new AppError('用户名或邮箱已存在', 400);
  }

  const user = await User.create({
    username,
    email,
    password,
    role: role || 'user',
    fullName: fullName || username,
    department,
    position
  });

  res.status(201).json({
    success: true,
    message: '用户创建成功',
    data: { user: user.toPublicJSON() }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  const { username, email, password, role, isActive } = req.body;

  if (username && username !== user.username) {
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new AppError('用户名已存在', 400);
    }
    user.username = username;
  }

  if (email && email !== user.email) {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new AppError('邮箱已存在', 400);
    }
    user.email = email;
  }

  if (password) user.password = password;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  res.json({
    success: true,
    message: '用户更新成功',
    data: { user: user.toPublicJSON() }
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  await user.destroy();

  res.json({
    success: true,
    message: '用户已删除'
  });
});

const toggleUserActive = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: user.isActive ? '用户已启用' : '用户已禁用',
    data: { user: user.toPublicJSON() }
  });
});

const getUserStats = asyncHandler(async (req, res) => {
  const total = await User.count();
  const active = await User.count({ where: { isActive: true } });
  const admins = await User.count({ where: { role: 'admin' } });
  const recentUsers = await User.findAll({
    where: { isActive: true },
    attributes: ['id', 'username', 'email', 'createdAt'],
    order: [['createdAt', 'DESC']],
    limit: 5
  });

  res.json({
    success: true,
    data: {
      overview: { total, active, admins },
      recentUsers
    }
  });
});

const getMyInfo = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  res.json({
    success: true,
    data: { user: user.toProfileJSON() }
  });
});

const updateMyInfo = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);

  if (!user) {
    throw new AppError('用户不存在', 404);
  }

  const { fullName, phone, department, position, gender, bio, skills } = req.body;

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (department !== undefined) user.department = department;
  if (position !== undefined) user.position = position;
  if (gender !== undefined) user.gender = gender;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) user.skills = skills;

  await user.save();

  res.json({
    success: true,
    message: '用户信息更新成功',
    data: { user: user.toProfileJSON() }
  });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const adminUsers = await User.count({ where: { role: 'admin' } });

  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    serverTime: new Date().toISOString()
  };

  res.json({
    success: true,
    data: {
      totalUsers,
      onlineUsers: 1,
      adminUsers,
      activeUsers,
      totalPosts: 0,
      totalRooms: 0,
      totalMessages: 0,
      system: systemInfo
    }
  });
});

const getAllContacts = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { isActive: true },
    attributes: ['id', 'username', 'fullName', 'avatar', 'department', 'position', 'lastLoginAt'],
    order: [['username', 'ASC']]
  });

  res.json({
    success: true,
    data: { users }
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
  getMyInfo,
  updateMyInfo,
  getDashboardStats,
  getAllContacts
};
