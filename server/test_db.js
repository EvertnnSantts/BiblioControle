const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'src', '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Conectado!");
    
    // Lista tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("📋 Tabelas no banco de dados:", tables.rows.map(r => r.table_name));

    // Testa ler de admins
    try {
      const admins = await client.query('SELECT COUNT(*) FROM admins');
      console.log("✓ Tabela 'admins' acessada, contagem:", admins.rows[0].count);
    } catch (e) {
      console.error("❌ Erro ao acessar 'admins':", e.message);
    }

    // Testa ler de users
    try {
      const users = await client.query('SELECT COUNT(*) FROM users');
      console.log("✓ Tabela 'users' acessada, contagem:", users.rows[0].count);
    } catch (e) {
      console.error("❌ Erro ao acessar 'users':", e.message);
    }

    await client.end();
  } catch (err) {
    console.error("❌ Erro geral:", err);
  }
}

run();
