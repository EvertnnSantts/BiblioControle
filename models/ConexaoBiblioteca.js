const mysql = require('mysql')
const Sequelize = require('sequelize');
const sequelize = new Sequelize('bibliotecav', 'root', '82937061', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Conexão bem-sucedida ao banco "bibliotecav".');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco "bibliotecav":', err);
  });

module.exports = {
  Sequelize: Sequelize,
  sequelize: sequelize
};

