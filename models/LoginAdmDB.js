const db = require('./ConexaoBiblioteca');
const LoginAdmDB = db.sequelize.define('LoginAdmDB', {
    email: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    senha: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
})

// Sincronize o modelo com o banco de dados
LoginAdmDB.sync({ force: false }).then(() => {
    console.log('Modelo "LoginAdmDB" sincronizado com o banco de dados');
  }).catch(err => {
    console.error('Erro ao sincronizar modelo "LoginAdmDB" com o banco de dados:', err);
  });
  
module.exports = LoginAdmDB;