const { User, sequelize, Sequelize } = require('../models');
const { logger } = require('../utils/logger');

const listUsers = async (req) => {
  const { page = 1, limit = 10, search, role, isActive } = req;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Sequelize.Op.or] = [
      { username: { [Sequelize.Op.like]: `%${search}%` } },
      { email: { [Sequelize.Op.like]: `%${search}%` } },
      { fullName: { [Sequelize.Op.like]: `%${search}%` } }
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined && isActive !== '') {
    where.isActive = isActive === 'true';
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'username', 'email', 'fullName', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt', 'lastLoginAt'],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  return {
    users: rows,
    total: count,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages
  };
};

const getUserById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) {
    throw new Error('用户不存在');
  }
  return user;
};

const getUserByUsername = async (username) => {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('用户不存在');
  }
  return user;
};

const createUser = async (req) => {
  const { username, email, password, fullName, department, position, role } = req;

  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    throw new Error('用户名已存在');
  }

  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    throw new Error('邮箱已被注册');
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    department,
    position,
    role: role || 'user',
    isActive: true
  });

  logger.info(`创建用户成功: ${user.id}`);
  return user;
};

const updateUser = async (id, req) => {
  const user = await getUserById(id);

  const { username, email, password, role, isActive, fullName } = req;

  if (username && username !== user.username) {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      throw new Error('用户名已存在');
    }
    user.username = username;
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('邮箱已被注册');
    }
    user.email = email;
  }

  if (password) {
    user.password = password;
  }

  if (role) {
    user.role = role;
  }

  if (isActive !== undefined) {
    user.isActive = isActive;
  }

  if (fullName) {
    user.fullName = fullName;
  }

  await user.save();
  return user;
};

const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
  return { success: true };
};

const toggleUserActive = async (id) => {
  const user = await getUserById(id);
  user.isActive = !user.isActive;
  await user.save();
  return user;
};

const getUserStats = async () => {
  const total = await User.count();
  const active = await User.count({ where: { isActive: true } });
  const admins = await User.count({ where: { role: 'admin' } });

  const recentUsers = await User.findAll({
    order: [['createdAt', 'DESC']],
    limit: 5,
    attributes: ['id', 'username', 'email', 'fullName', 'createdAt']
  });

  return {
    total,
    active,
    admins,
    recentUsers
  };
};

const getDashboardStats = async () => {
  const totalUsers = await User.count();
  const activeUsers = await User.count({ where: { isActive: true } });
  const adminCount = await User.count({ where: { role: 'admin' } });

  return {
    totalUsers,
    activeUsers,
    adminCount
  };
};

const getAllContacts = async (currentUserId) => {
  const users = await User.findAll({
    where: {
      id: { [Sequelize.Op.ne]: currentUserId },
      isActive: true
    },
    attributes: ['id', 'username', 'email', 'fullName', 'avatar', 'department', 'position']
  });

  return users.map(user => ({
    id: user.id,
    name: user.fullName || user.username,
    email: user.email,
    avatar: user.avatar,
    department: user.department,
    position: user.position
  }));
};

const updateProfile = async (userId, req) => {
  const user = await getUserById(userId);

  const { fullName, avatar, phone, gender, bio, skills, department, position } = req;

  if (fullName !== undefined) user.fullName = fullName;
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = phone;
  if (gender !== undefined) user.gender = gender;
  if (bio !== undefined) user.bio = bio;
  if (skills !== undefined) user.skills = skills;
  if (department !== undefined) user.department = department;
  if (position !== undefined) user.position = position;

  await user.save();
  return user;
};

module.exports = {
  listUsers,
  getUserById,
  getUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActive,
  getUserStats,
  getDashboardStats,
  getAllContacts,
  updateProfile
};
