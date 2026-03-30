const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'bibliotecav',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '82937061',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida');
    
    // Sincronizar modelos em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados com o banco');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar banco:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };