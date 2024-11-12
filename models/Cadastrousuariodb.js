const db = require('./ConexaoBiblioteca');

const CadastrousuarioDB = db.sequelize.define('CadastrousuarioDB', {
   
    nome: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
   email: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  senha: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },

  telefone: {
    type: db.Sequelize.STRING,
    allowNull: false,
  }, 
   
  endereco: { 
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  matricula: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  curso: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
});

CadastrousuarioDB.sync({ alter: true }).then(() => {
  console.log('Modelo "CadastrousuarioDB" sincronizado com o banco de dados');
}).catch(err => {
  console.error('Erro ao sincronizar modelo "CadastrousuarioDB" com o banco de dados:', err);
});

module.exports = CadastrousuarioDB;