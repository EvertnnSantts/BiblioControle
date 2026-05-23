// ALTERAÇÕES:
// 1. dialect 'mysql' → 'postgres'  (suporte nativo ao Supabase/PostgreSQL)
// 2. Removidas credenciais hardcoded — agora usa DATABASE_URL via variável de ambiente
// 3. Adicionado ssl: { rejectUnauthorized: false } — obrigatório no Supabase
// 4. pool ajustado para ambiente serverless (max:5, idle:5000, evict:10000)
// 5. sync({ alter: true }) removido de produção — migrações devem ser manuais via SQL

const { Sequelize } = require('sequelize');
const pg = require('pg');
const path = require('path');

// Carrega o .env da pasta /server independente de onde o node foi chamado
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Configure a variável de ambiente.');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pg,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // SSL obrigatório para Supabase (e a maioria dos Postgres gerenciados)
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false   // Supabase usa certificados auto-assinados no pooler
    }
  },

  // Pool reduzido para plataformas serverless (Railway/Render/Koyeb)
  // Supabase free tier aceita max ~15 conexões simultâneas
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 5000,
    evict: 10000
  },

  define: {
    timestamps: true,
    underscored: true     // converte camelCase do JS → snake_case no banco
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com Supabase/PostgreSQL estabelecida');

    // Em produção NÃO use sync — as tabelas já devem existir (criadas via SQL no Supabase)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });   // alter:false evita alterações destrutivas acidentais
      console.log('✅ Modelos sincronizados');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar banco:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };