// ALTERAÇÕES:
// 1. CORS aceita múltiplas origens: localhost em dev + domínio Vercel em produção
//    Lê CLIENT_URL do .env; aceita lista separada por vírgula para múltiplos domínios
// 2. Rate limit reduzido para 200 req/15min em produção (era 1000 — excessivo)
// 3. JWT_SECRET sem fallback hardcoded — falha explicitamente se não configurado
// 4. Trusts proxy adicionado (obrigatório no Railway/Render/Koyeb para rate limiting correto)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/validation');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const loanRoutes = require('./routes/loans');
const localConsultationRoutes = require('./routes/localConsultations');
const attendanceRoutes = require('./routes/attendance');
const studentRoutes = require('./routes/student');

// Validação de segredos obrigatórios
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Configure a variável de ambiente.');
}

const app = express();
const PORT = process.env.PORT || 5000;

// ALTERADO: trusts proxy — necessário quando o servidor fica atrás de um proxy reverso
// (Railway, Render, Koyeb, Vercel Edge, Nginx) para que req.ip seja o IP real do cliente
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// ALTERADO: CORS aceita lista de origens separadas por vírgula via variável de ambiente
// Exemplo no .env: CLIENT_URL=https://biblicontrole.vercel.app,http://localhost:5173
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite requisições sem origem (ex: Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  },
  credentials: true
}));

// ALTERADO: limite ajustado para produção
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: { success: false, message: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/local-consultations', localConsultationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    const [result] = await sequelize.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'API BiblioControle funcionando e conectada ao banco!',
      dbTime: result[0],
      env: process.env.NODE_ENV
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Falha na conexão com o banco de dados',
      error: err.message,
      stack: err.stack
    });
  }
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando na porta ${PORT}`);
      console.log(`✅ CORS liberado para: ${allowedOrigins.join(', ')}`);
    });
  } catch (error) {
    console.error('❌ Falha ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
