require('dotenv').config();
require('pg-hstore');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/validation');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const loanRoutes = require('./routes/loans');
const localConsultationRoutes = require('./routes/localConsultations');
const attendanceRoutes = require('./routes/attendance');
const studentRoutes = require('./routes/student');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET não definido. Configure a variável de ambiente.');
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  },
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
  message: { success: false, message: 'Muitas requisições, tente novamente mais tarde' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);
app.use('/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas com prefixo /api
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/local-consultations', localConsultationRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/student', studentRoutes);

// Aliases sem prefixo /api (compatibilidade com frontend)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/books', bookRoutes);
app.use('/loans', loanRoutes);
app.use('/local-consultations', localConsultationRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/student', studentRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    const [result] = await sequelize.query('SELECT NOW()');
    res.json({
      success: true,
      message: 'API BiblioControle funcionando!',
      dbTime: result[0],
      env: process.env.NODE_ENV
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Falha na conexão com o banco de dados',
      error: err.message
    });
  }
});

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// Em produção (Vercel serverless), não chama app.listen
// O handler é exportado diretamente
if (process.env.NODE_ENV !== 'production') {
  const { connectDB } = require('./config/database');
  const startServer = async () => {
    try {
      await connectDB();
      app.listen(PORT, () => {
        console.log(`✅ Servidor rodando na porta ${PORT}`);
        console.log(`✅ CORS liberado para: ${allowedOrigins.join(', ')}`);
      });
    } catch (error) {
      console.error('❌ Falha ao iniciar servidor:', error);
    }
  };
  startServer();
} else {
  // Conecta ao banco de forma lazy (sem travar o boot)
  const { connectDB } = require('./config/database');
  connectDB().catch(err => console.error('❌ Erro ao conectar banco:', err));
}

module.exports = app;
