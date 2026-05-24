const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'src', '.env') });
const { sequelize } = require('./src/models');

async function syncDatabase() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Sincronizando os modelos com o banco (alter: true)...');
    
    // alter: true criará as tabelas faltantes e atualizará colunas modificadas (como duracaoMinutos)
    await sequelize.sync({ alter: true });
    
    console.log('✅ Banco de dados sincronizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco:', error);
  } finally {
    process.exit();
  }
}

syncDatabase();
