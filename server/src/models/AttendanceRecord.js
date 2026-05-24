const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  attendanceListId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'attendance_lists',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  horarioEntrada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  horarioSaida: {
    type: DataTypes.DATE,
    allowNull: true
  },
  codigoSaida: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pendente',
    validate: {
      isIn: [['pendente', 'presente', 'saida_nao_confirmada']]
    }
  }
}, {
  tableName: 'attendance_records',
  timestamps: true
});

module.exports = AttendanceRecord;
