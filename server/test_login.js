const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'src', '.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Admin } = require('./src/models');

async function test() {
  try {
    console.log("🔍 Buscando o primeiro administrador cadastrado no Supabase...");
    const admin = await Admin.findOne();
    if (!admin) {
      console.log("⚠️ Nenhum administrador cadastrado no banco!");
      return;
    }
    console.log(`✅ Admin encontrado: ${admin.email} (Ativo: ${admin.ativo}, Role: ${admin.role})`);
    
    // Testa gerar token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );
    console.log("✅ Token JWT gerado com sucesso:", token);
    
    // Salva último acesso
    admin.ultimoAcesso = new Date();
    await admin.save();
    console.log("✅ Último acesso atualizado e salvo com sucesso no Supabase!");
  } catch (err) {
    console.error("❌ Erro durante o fluxo de login:", err);
  } finally {
    process.exit(0);
  }
}

test();
