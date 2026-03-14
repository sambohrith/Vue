/**
 * 房间成员模型
 * 功能：管理房间与用户的关联关系、成员角色、阅读状态
 * 优化：添加数据库索引、查询优化
 */

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/database');

class RoomMember extends Model {
  /**
   * 检查用户是否在房间中
   * @param {number} roomId - 房间ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  static async isInRoom(roomId, userId) {
    const member = await this.findOne({
      where: { roomId, userId }
    });
    return !!member;
  }

  /**
   * 获取用户在房间中的角色
   * @param {number} roomId - 房间ID
   * @param {number} userId - 用户ID
   * @returns {Promise<string|null>} 角色或null
   */
  static async getRole(roomId, userId) {
    const member = await this.findOne({
      where: { roomId, userId },
      attributes: ['role']
    });
    return member?.role || null;
  }

  /**
   * 更新最后阅读时间
   * @returns {Promise<RoomMember>}
   */
  async updateLastRead() {
    this.lastReadAt = new Date();
    return await this.save({ hooks: false });
  }

  /**
   * 获取用户的未读消息数
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    if (!this.lastReadAt) {
      // 如果没有阅读记录，返回房间所有消息数
      return await sequelize.models.RoomMessage.count({
        where: { roomId: this.roomId }
      });
    }

    return await sequelize.models.RoomMessage.count({
      where: {
        roomId: this.roomId,
        createdAt: { [require('sequelize').Op.gt]: this.lastReadAt },
        senderId: { [require('sequelize').Op.ne]: this.userId } // 排除自己发送的消息
      }
    });
  }

  // ==================== 静态方法 ====================

  /**
   * 添加成员到房间
   * @param {number} roomId - 房间ID
   * @param {number} userId - 用户ID
   * @param {string} role - 角色
   * @returns {Promise<RoomMember>}
   */
  static async addMember(roomId, userId, role = 'member') {
    const [member, created] = await this.findOrCreate({
      where: { roomId, userId },
      defaults: { role, joinedAt: new Date() }
    });
    
    if (!created && member.role !== role) {
      member.role = role;
      await member.save({ hooks: false });
    }
    
    return member;
  }

  /**
   * 从房间移除成员
   * @param {number} roomId - 房间ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>}
   */
  static async removeMember(roomId, userId) {
    const result = await this.destroy({
      where: { roomId, userId }
    });
    return result > 0;
  }

  /**
   * 获取房间的所有成员
   * @param {number} roomId - 房间ID
   * @returns {Promise<RoomMember[]>}
   */
  static async findByRoom(roomId) {
    return await this.findAll({
      where: { roomId },
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'avatar', 'email']
      }],
      order: [
        ['role', 'ASC'], // owner > admin > member
        ['joinedAt', 'ASC']
      ]
    });
  }

  /**
   * 获取用户加入的所有房间
   * @param {number} userId - 用户ID
   * @returns {Promise<RoomMember[]>}
   */
  static async findByUser(userId) {
    return await this.findAll({
      where: { userId },
      include: [{
        model: sequelize.models.Room,
        as: 'room',
        include: [{
          model: sequelize.models.User,
          as: 'owner',
          attributes: ['id', 'username', 'fullName', 'avatar']
        }]
      }],
      order: [['joinedAt', 'DESC']]
    });
  }

  /**
   * 获取房间的成员数量
   * @param {number} roomId - 房间ID
   * @returns {Promise<number>}
   */
  static async getMemberCount(roomId) {
    return await this.count({ where: { roomId } });
  }

  /**
   * 批量更新最后阅读时间
   * @param {number} roomId - 房间ID
   * @param {number} userId - 用户ID
   * @returns {Promise<void>}
   */
  static async updateLastRead(roomId, userId) {
    await this.update(
      { lastReadAt: new Date() },
      { where: { roomId, userId } }
    );
  }
}

RoomMember.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    comment: '成员记录ID，主键'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rooms',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '房间ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: '用户ID'
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    allowNull: false,
    defaultValue: 'member',
    comment: '成员角色：房主、管理员、普通成员'
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '加入时间'
  },
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后阅读时间，用于计算未读消息'
  }
}, {
  sequelize,
  modelName: 'RoomMember',
  tableName: 'room_members',
  timestamps: true,
  updatedAt: false, // 不需要 updatedAt，使用 joinedAt
  underscored: true,
  indexes: [
    // 唯一索引：一个用户在一个房间只能有一条记录
    { unique: true, fields: ['room_id', 'user_id'] },
    // 查询优化索引
    { fields: ['room_id'] },
    { fields: ['user_id'] },
    { fields: ['role'] },
    { fields: ['joined_at'] },
    // 复合索引
    { fields: ['room_id', 'role'] }
  ],
  hooks: {
    beforeValidate: (member) => {
      // 数据清理
      if (member.role) member.role = member.role.toLowerCase();
    }
  }
});

module.exports = RoomMember;
