/**
 * 房间/圈子模型
 * 功能：创建房间、管理房间成员、生成邀请码
 * 优化：添加数据库索引、查询优化
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class Room extends Model {
  /**
   * 生成房间邀请码
   * @returns {string} 6位大写字母数字组合
   */
  static generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * 检查用户是否是房间成员
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  async isMember(userId) {
    const member = await this.getMembers({
      where: { userId }
    });
    return member.length > 0;
  }

  /**
   * 检查用户是否是房主
   * @param {number} userId - 用户ID
   * @returns {boolean}
   */
  isOwner(userId) {
    return this.ownerId === userId;
  }

  /**
   * 获取房间统计信息
   * @returns {Promise<Object>}
   */
  async getStats() {
    const [memberCount, messageCount, lastMessage] = await Promise.all([
      this.countMembers(),
      sequelize.models.RoomMessage.count({ where: { roomId: this.id } }),
      sequelize.models.RoomMessage.findOne({
        where: { roomId: this.id },
        order: [['createdAt', 'DESC']],
        attributes: ['createdAt']
      })
    ]);

    return {
      memberCount,
      messageCount,
      lastMessageAt: lastMessage?.createdAt || null,
      isFull: memberCount >= this.maxMembers
    };
  }

  // ==================== 静态方法 ====================

  /**
   * 根据邀请码查找房间
   * @param {string} inviteCode - 邀请码
   * @returns {Promise<Room|null>}
   */
  static async findByInviteCode(inviteCode) {
    return await this.findOne({
      where: { 
        inviteCode: inviteCode.toUpperCase(),
        type: 'public'
      }
    });
  }

  /**
   * 搜索房间
   * @param {string} query - 搜索关键词
   * @param {Object} options - 查询选项
   * @returns {Promise<Room[]>}
   */
  static async search(query, options = {}) {
    const { limit = 20, offset = 0, type } = options;
    const searchTerm = `%${query}%`;
    
    const where = {
      name: { [require('sequelize').Op.like]: searchTerm }
    };
    
    if (type) {
      where.type = type;
    }

    return await this.findAll({
      where,
      include: [{
        association: 'owner',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * 获取用户的房间列表
   * @param {number} userId - 用户ID
   * @returns {Promise<Room[]>}
   */
  static async findByUser(userId) {
    return await this.findAll({
      include: [{
        model: sequelize.models.RoomMember,
        as: 'members',
        where: { userId },
        attributes: ['role', 'joinedAt', 'lastReadAt']
      }, {
        association: 'owner',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * 获取热门房间（按成员数排序）
   * @param {number} limit - 返回数量
   * @returns {Promise<Room[]>}
   */
  static async findPopular(limit = 10) {
    return await this.findAll({
      where: { type: 'public' },
      include: [{
        association: 'owner',
        attributes: ['id', 'username', 'fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']],
      limit
    });
  }
}

Room.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '房间ID，主键'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100],
      notEmpty: true
    },
    comment: '房间名称'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      len: [0, 500]
    },
    comment: '房间描述'
  },
  ownerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '房主ID'
  },
  type: {
    type: DataTypes.ENUM('public', 'private'),
    allowNull: false,
    defaultValue: 'public',
    comment: '房间类型：公开或私有'
  },
  inviteCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: true,
    comment: '邀请码，公开房间使用'
  },
  maxMembers: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 100,
    validate: {
      min: 2,
      max: 500
    },
    comment: '最大成员数'
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '房间头像URL'
  }
}, {
  sequelize,
  modelName: 'Room',
  tableName: 'rooms',
  timestamps: true,
  underscored: true,
  indexes: [
    // 查询优化索引
    { fields: ['owner_id'] },
    { fields: ['type'] },
    { fields: ['invite_code'] },
    { fields: ['created_at'] },
    // 复合索引
    { fields: ['type', 'created_at'] }
  ],
  hooks: {
    beforeCreate: async (room) => {
      if (room.type === 'public' && !room.inviteCode) {
        room.inviteCode = Room.generateInviteCode();
      }
    },
    beforeValidate: (room) => {
      // 清理数据
      if (room.name) room.name = room.name.trim();
      if (room.description) room.description = room.description.trim();
      if (room.inviteCode) room.inviteCode = room.inviteCode.toUpperCase();
    }
  }
});

module.exports = Room;
