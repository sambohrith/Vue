const { sequelize, Sequelize } = require('./database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING(50),
    allowNull: false,
    unique: true
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING(255),
    allowNull: false
  },
  fullName: {
    type: Sequelize.STRING(100),
    field: 'full_name'
  },
  avatar: {
    type: Sequelize.STRING(255)
  },
  phone: {
    type: Sequelize.STRING(20)
  },
  gender: {
    type: Sequelize.STRING(10)
  },
  bio: {
    type: Sequelize.TEXT
  },
  skills: {
    type: Sequelize.TEXT
  },
  department: {
    type: Sequelize.STRING(100)
  },
  position: {
    type: Sequelize.STRING(100)
  },
  role: {
    type: Sequelize.STRING(20),
    defaultValue: 'user'
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLoginAt: {
    type: Sequelize.DATE,
    field: 'last_login_at'
  }
}, {
  tableName: 'users',
  paranoid: true,
  deletedAt: 'deletedAt',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
});

User.prototype.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toPublicJSON = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar: this.avatar,
    phone: this.phone,
    department: this.department,
    position: this.position,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    lastLoginAt: this.lastLoginAt
  };
};

User.prototype.toProfileJSON = function() {
  return {
    id: this.id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    avatar: this.avatar,
    phone: this.phone,
    gender: this.gender,
    bio: this.bio,
    skills: this.skills,
    department: this.department,
    position: this.position,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt
  };
};

module.exports = User;
