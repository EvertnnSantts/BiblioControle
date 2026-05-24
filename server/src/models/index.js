const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const User = require('./User');
const Book = require('./Book');
const Loan = require('./Loan');
const BlockedUser = require('./BlockedUser');
const LocalConsultation = require('./LocalConsultation');
const AttendanceList = require('./AttendanceList');
const AttendanceRecord = require('./AttendanceRecord');

// Definir associações
Book.hasMany(Loan, { foreignKey: 'bookId', as: 'loans' });
Loan.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Book.hasMany(LocalConsultation, { foreignKey: 'bookId', as: 'consultas' });
LocalConsultation.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(LocalConsultation, { foreignKey: 'userId', as: 'consultas' });
LocalConsultation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Admin.hasMany(BlockedUser, { foreignKey: 'bloqueadoPor', as: 'bloqueios' });
BlockedUser.belongsTo(Admin, { foreignKey: 'bloqueadoPor', as: 'admin' });

// Associações Lista de Presença
AttendanceList.hasMany(AttendanceRecord, { foreignKey: 'attendanceListId', as: 'records', onDelete: 'CASCADE' });
AttendanceRecord.belongsTo(AttendanceList, { foreignKey: 'attendanceListId', as: 'list' });

User.hasMany(AttendanceRecord, { foreignKey: 'userId', as: 'attendances' });
AttendanceRecord.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  Admin,
  User,
  Book,
  Loan,
  BlockedUser,
  LocalConsultation,
  AttendanceList,
  AttendanceRecord
};