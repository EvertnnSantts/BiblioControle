const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BlockedUser = sequelize.define('BlockedUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  bloqueadoPor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  }
}, {
  tableName: 'blocked_users',
  timestamps: true
});

module.exports = BlockedUser;