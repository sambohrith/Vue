/**
 * 用户模型 - 优化版
 * 简化字段，保留核心功能
 */

const { DataTypes, Model, Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const crypto = require('crypto');

// MD5 加密函数
function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

class User extends Model {
  /**
   * 比较密码方法
   * @param {string} candidatePassword - 待验证的密码
   * @returns {boolean} 密码是否匹配
   */
  async comparePassword(candidatePassword) {
    return md5Hash(candidatePassword) === this.password;
  }

  /**
   * 更新最后登录时间
   * @returns {Promise<User>}
   */
  async updateLoginInfo() {
    this.lastLoginAt = new Date();
    this.loginCount = (this.loginCount || 0) + 1;
    return await this.save({ validate: false, hooks: false });
  }

  /**
   * 检查用户是否在线（30分钟内有过活动视为在线）
   * @returns {boolean}
   */
  isOnline() {
    if (!this.lastLoginAt) return false;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return new Date(this.lastLoginAt) > thirtyMinutesAgo;
  }

  /**
   * 获取公开信息（不包含敏感字段）
   * @returns {Object}
   */
  toPublicJSON() {
    const user = this.toJSON();
    delete user.password;
    delete user.passwordChangedAt;
    return user;
  }

  /**
   * 获取完整信息（用于管理员）
   * @returns {Object}
   */
  toAdminJSON() {
    return this.toJSON();
  }

  /**
   * 获取个人信息（用于个人资料页面）
   * @returns {Object}
   */
  toProfileJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      isActive: this.isActive,
      fullName: this.fullName,
      gender: this.gender,
      phone: this.phone,
      department: this.department,
      position: this.position,
      employeeId: this.employeeId,
      highestDegree: this.highestDegree,
      school: this.school,
      major: this.major,
      province: this.province,
      city: this.city,
      addressDetail: this.addressDetail,
      avatar: this.avatar,
      bio: this.bio,
      skills: this.skills,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt
    };
  }

  // ==================== 静态方法 ====================

  /**
   * 根据角色查找用户
   * @param {string} role - 用户角色
   * @returns {Promise<User[]>}
   */
  static async findByRole(role) {
    return await this.findAll({ 
      where: { role, isActive: true },
      attributes: { exclude: ['password', 'passwordChangedAt'] }
    });
  }

  /**
   * 搜索用户（优化版本，使用索引字段）
   * @param {string} query - 搜索关键词
   * @param {Object} options - 查询选项
   * @returns {Promise<User[]>}
   */
  static async search(query, options = {}) {
    const { limit = 20, offset = 0 } = options;
    const searchTerm = `%${query}%`;
    
    return await this.findAndCountAll({
      where: {
        isActive: true,
        [Op.or]: [
          { username: { [Op.like]: searchTerm } },
          { fullName: { [Op.like]: searchTerm } },
          { email: { [Op.like]: searchTerm } },
          { department: { [Op.like]: searchTerm } }
        ]
      },
      attributes: { exclude: ['password', 'passwordChangedAt'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * 获取统计数据
   * @returns {Promise<Object>}
   */
  static async getStats() {
    const [total, admins, active, online] = await Promise.all([
      this.count(),
      this.count({ where: { role: 'admin' } }),
      this.count({ where: { isActive: true } }),
      this.count({
        where: {
          lastLoginAt: {
            [Op.gte]: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      })
    ]);

    return { total, admins, active, online };
  }
}

User.init({
  // 基础认证信息
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: { len: [3, 30] },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(64),
    allowNull: false,
    validate: { len: [6, 100] },
  },
  
  // 角色和状态
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['admin', 'user']],
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  
  // ==================== 个人基本信息（核心字段） ====================
  fullName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    validate: { len: [0, 50] },
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      isIn: [['male', 'female', 'other', '']],
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  
  // ==================== 工作信息 ====================
  department: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  position: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  employeeId: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  
  // ==================== 教育信息 ====================
  highestDegree: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      isIn: [['high_school', 'associate', 'bachelor', 'master', 'doctorate', 'other', '']],
    },
  },
  school: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  major: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  
  // ==================== 地址信息 ====================
  province: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  addressDetail: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  
  // ==================== 其他信息 ====================
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: { isUrl: true },
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: { len: [0, 500] },
  },
  skills: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '技能标签，逗号分隔',
  },
  
  // ==================== 账户元数据 ====================
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  loginCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // ==================== 时间戳 ====================
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['username'] },
    { unique: true, fields: ['email'] },
    { fields: ['role'] },
    { fields: ['isActive'] },
    { fields: ['role', 'isActive'] },
    { fields: ['lastLoginAt'] },
    { fields: ['fullName'] },
    { fields: ['employeeId'] },
    { fields: ['department'] },
    { fields: ['createdAt'] },
  ],
  hooks: {
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = md5Hash(user.password);
        user.passwordChangedAt = new Date();
      }
    },
  },
});

module.exports = User;
