const { sequelize } = require('../config/database');
const Admin = require('./Admin');
const User = require('./User');
const Book = require('./Book');
const Loan = require('./Loan');
const BlockedUser = require('./BlockedUser');

// Definir associações
Book.hasMany(Loan, { foreignKey: 'bookId', as: 'loans' });
Loan.belongsTo(Book, { foreignKey: 'bookId', as: 'book' });

User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Admin.hasMany(BlockedUser, { foreignKey: 'bloqueadoPor', as: 'bloqueios' });
BlockedUser.belongsTo(Admin, { foreignKey: 'bloqueadoPor', as: 'admin' });

module.exports = {
  sequelize,
  Admin,
  User,
  Book,
  Loan,
  BlockedUser
};