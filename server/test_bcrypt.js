const bcrypt = require('bcryptjs');

async function run() {
  try {
    console.log("Criptografando senha...");
    const hash = await bcrypt.hash('123456', 12);
    console.log("✅ Hash gerado com sucesso:", hash);
    
    console.log("Comparando senha...");
    const match = await bcrypt.compare('123456', hash);
    console.log("✅ Comparação concluída com resultado:", match);
  } catch (e) {
    console.error("❌ Erro no bcryptjs:", e);
  } finally {
    process.exit(0);
  }
}

run();
