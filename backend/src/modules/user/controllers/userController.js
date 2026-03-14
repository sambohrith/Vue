const User = require('../models/User');
const { Op } = require('sequelize');
const crypto = require('crypto');

// MD5 加密函数
function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

async function getUsers(req, res) {
  try {
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
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function getUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, password, role, fullName, department, position } = req.body;

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 直接传递明文密码，让User模型的beforeSave钩子自动加密
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
      data: { user: { id: user.id, username: user.username, email: user.email, role: user.role } }
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function updateUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { username, email, password, role, isActive } = req.body;

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({ success: false, message: '用户名已存在' });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: '邮箱已存在' });
      }
      user.email = email;
    }

    if (password) {
      user.password = md5Hash(password);
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: '用户更新成功',
      data: { user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive } }
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 硬删除用户
    await user.destroy();

    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    // 处理外键约束错误
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        success: false, 
        message: '该用户有关联数据（如聊天记录），无法删除。建议使用禁用功能。' 
      });
    }
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function activateUser(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: '用户已激活'
    });
  } catch (error) {
    console.error('激活用户失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

async function getUserStats(req, res) {
  try {
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
  } catch (error) {
    console.error('获取用户统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取当前用户信息
async function getMyInfo(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新当前用户信息
async function updateMyInfo(req, res) {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { fullName, phone, department, position, gender, dateOfBirth } = req.body;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (department !== undefined) user.department = department;
    if (position !== undefined) user.position = position;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;

    await user.save();

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName } }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 更新用户状态（启用/禁用）
async function updateUserStatus(req, res) {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const { isActive } = req.body;
    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: isActive ? '用户已启用' : '用户已禁用'
    });
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取仪表盘统计数据
async function getDashboardStats(req, res) {
  try {
    // 用户统计
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const adminUsers = await User.count({ where: { role: 'admin' } });
    // 只显示当前登录的用户（固定为1）
    const onlineUsers = 1;

    // 系统信息
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
        onlineUsers,
        adminUsers,
        activeUsers,
        totalPosts: 0,
        totalRooms: 0,
        totalMessages: 0,
        system: systemInfo
      }
    });
  } catch (error) {
    console.error('获取仪表盘统计失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

// 获取所有联系人列表（供联系人目录使用）
async function getAllContacts(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'fullName', 'avatar', 'role', 'department', 'position', 'isActive', 'createdAt'],
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('获取联系人列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUserStats,
  getMyInfo,
  updateMyInfo,
  updateUserStatus,
  getDashboardStats,
  getAllContacts
};
