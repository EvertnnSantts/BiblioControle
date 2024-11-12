const db = require('./ConexaoBiblioteca');

const SaidaLivroDB = db.sequelize.define('SaidaLivroDB', {
    id: {
        type: db.Sequelize.INTEGER,
        primaryKey: true, 
        autoIncrement: true,
        allowNull: false,
        unique: true,
    },
    titulosaida: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    ids: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    usuario : {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    telefonesaida: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    enderecosaida: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    cursosaida: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    turma: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
});

SaidaLivroDB.sync({ alter: true }).then(() => {
    console.log('Modelo "SaidaLivroDB" sincronizado com o banco de dados');
}).catch(err => {
    console.error('Erro ao sincronizar modelo "SaidaLivroDB" com o banco de dados:', err);
});

module.exports = SaidaLivroDB;
