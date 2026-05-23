require('dotenv').config({ path: './src/.env' });
const { sequelize } = require('./src/config/database');
const Admin = require('./src/models/Admin');

async function seed() {
  await sequelize.authenticate();

  await Admin.destroy({ where: { email: 'Biblio@biblicontrole.com' } });

  const admin = await Admin.create({
    email: 'Biblio@biblicontrole.com',
    password: '82937061',
    nome: 'Administrador',
    ativo: true
  });

  console.log('Admin criado com sucesso:', admin.email);
  await sequelize.close();
}

seed().catch(console.error);