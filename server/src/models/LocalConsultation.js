const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LocalConsultation = sequelize.define('LocalConsultation', {
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
  dataRetirada: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dataExpiracao: {
    type: DataTypes.DATE,
    allowNull: false
  },
  dataDevolucao: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duracaoHoras: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 4,
    validate: {
      min: 1,
      max: 24
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'em_consulta',
    validate: {
      isIn: {
        args: [['em_consulta', 'vencida', 'devolvida']],
        msg: 'Status inválido. Use: em_consulta, vencida ou devolvida'
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
  tableName: 'local_consultations',
  timestamps: true
});

LocalConsultation.prototype.isVencida = function () {
  if (this.status !== 'em_consulta') return false;
  return new Date() > new Date(this.dataExpiracao);
};

module.exports = LocalConsultation;
