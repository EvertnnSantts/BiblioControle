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
  status: {
    type: DataTypes.ENUM('ativo', 'devolvido', 'atrasado', 'bloqueado'),
    defaultValue: 'ativo'
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

// Verificar se está atrasado
Loan.prototype.isAtrasado = function() {
  if (this.status !== 'ativo') return false;
  const hoje = new Date();
  const dataPrevista = new Date(this.dataPrevista);
  return hoje > dataPrevista;
};

module.exports = Loan;