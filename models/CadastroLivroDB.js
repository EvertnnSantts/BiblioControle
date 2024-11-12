const { Sequelize, DataTypes } = require('sequelize');
const db = require('./ConexaoBiblioteca');

const CadastroLivros = db.sequelize.define('CadastroLivros', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
    unique: true,
  },
  titulocad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  autorcad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  quantidadecad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estantecad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  observacaocad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  situacaocad: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  generocad: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {});

CadastroLivros.sync({ alter: true }).then(() => {
  console.log('Modelo "CadastroLivroDB" sincronizado com o banco de dados');
}).catch(err => {
  console.error('Erro ao sincronizar modelo "CadastroLivroDB" com o banco de dados:', err);
});

module.exports = CadastroLivros;

