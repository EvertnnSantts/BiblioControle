// ALTERAÇÕES:
// 1. DataTypes.ENUM('ativo','devolvido','atrasado','bloqueado') → DataTypes.STRING(20)
//    com validate.isIn() — mesma estratégia do Book.js, sem depender de CREATE TYPE

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Loan = sequelize.define('Loan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bookId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books',
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
  dataEmprestimo: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dataDevolucao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  dataPrevista: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  // ALTERADO: era DataTypes.ENUM('ativo','devolvido','atrasado','bloqueado')
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'ativo',
    validate: {
      isIn: {
        args: [['ativo', 'devolvido', 'atrasado', 'bloqueado']],
        msg: 'Status inválido. Use: ativo, devolvido, atrasado ou bloqueado'
      }
    }
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  turma: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'loans',
  timestamps: true
});

Loan.prototype.isAtrasado = function () {
  if (this.status !== 'ativo') return false;
  return new Date() > new Date(this.dataPrevista);
};

module.exports = Loan;
