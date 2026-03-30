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
  // Removido 'emprestimo' da situação - controlado automaticamente
  situacao: {
    type: DataTypes.ENUM('disponivel', 'consulta', 'reservado'),
    defaultValue: 'disponivel'
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
      // Inicializa quantidade disponível igual à quantidade total
      book.quantidadeDisponivel = book.quantidade;
    },
    beforeUpdate: (book) => {
      // Se a quantidade total foi alterada, recalcula a disponível
      if (book.changed('quantidade')) {
        const diferenca = book.quantidade - book.dataValues.quantidade;
        book.quantidadeDisponivel = book.quantidadeDisponivel + diferenca;
      }
    }
  }
});

// Método para verificar disponibilidade
Book.prototype.isDisponivel = function() {
  return this.situacao === 'disponivel' && this.quantidadeDisponivel > 0;
};

// Método para calcular quantidade disponível baseado em empréstimos ativos
Book.prototype.calcularDisponivel = async function() {
  const { Loan } = require('../models');
  const emprestimosAtivos = await Loan.count({
    where: {
      bookId: this.id,
      status: 'ativo'
    }
  });
  return Math.max(0, this.quantidade - emprestimosAtivos);
};

module.exports = Book;