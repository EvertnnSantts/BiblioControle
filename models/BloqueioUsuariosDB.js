const db = require('./ConexaoBiblioteca');
const  BloqueioUsuarios = db.sequelize.define('BloqueioUsuariosDB', {
    email: {
        type: db.Sequelize.STRING,
    allowNull: false,
    },
    telefone: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
});

BloqueioUsuarios.sync({ alter: true }).then(() => {
    console.log('Modelo "BloqueioUsuarios" sincronizado com o banco de dados');
  }).catch(err => {
    console.error('Erro ao sincronizar modelo "BloqueioUsuarios" com o banco de dados:', err);
});

module.exports = BloqueioUsuarios;