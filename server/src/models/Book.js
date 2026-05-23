// ALTERAÇÕES:
// 1. DataTypes.ENUM('disponivel','consulta','reservado') → DataTypes.STRING(20)
//    Motivo: ENUM no PostgreSQL requer CREATE TYPE, o que complica migrações.
//    A validação dos valores permitidos é feita via validate.isIn() no próprio modelo.
// 2. Sem outras mudanças de lógica.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255]
    }
  },
  autor: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  quantidadeDisponivel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 0
    }
  },
  estante: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // ALTERADO: era DataTypes.ENUM('disponivel','consulta','reservado')
  // Agora é STRING com validação — compatível com PostgreSQL sem CREATE TYPE
  situacao: {
    type: DataTypes.STRING(20),
    defaultValue: 'disponivel',
    validate: {
      isIn: {
        args: [['disponivel', 'consulta', 'reservado']],
        msg: 'Situação inválida. Use: disponivel, consulta ou reservado'
      }
    }
  },
  genero: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  tableName: 'books',
  timestamps: true,
  hooks: {
    beforeCreate: (book) => {
      book.quantidadeDisponivel = book.quantidade;
    },
    beforeUpdate: (book) => {
      if (book.changed('quantidade')) {
        const diferenca = book.quantidade - book._previousDataValues.quantidade;
        book.quantidadeDisponivel = Math.max(0, book.quantidadeDisponivel + diferenca);
      }
    }
  }
});

Book.prototype.isDisponivel = function () {
  return this.situacao === 'disponivel' && this.quantidadeDisponivel > 0;
};

Book.prototype.calcularDisponivel = async function () {
  const { Loan } = require('../models');
  const emprestimosAtivos = await Loan.count({
    where: { bookId: this.id, status: 'ativo' }
  });
  return Math.max(0, this.quantidade - emprestimosAtivos);
};

module.exports = Book;
