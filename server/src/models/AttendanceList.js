const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceList = sequelize.define('AttendanceList', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  turno: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['Manhã', 'Tarde', 'Noite']]
    }
  }
}, {
  tableName: 'attendance_lists',
  timestamps: true
});

module.exports = AttendanceList;
