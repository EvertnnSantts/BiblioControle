const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { loginSchema, createAdminSchema } = require('../utils/validations');

/**
 * Gerar token JWT
 */
const generateToken = (user, type = 'admin') => {
  return jwt.sign(
    { id: user.id, email: user.email, role: type === 'admin' ? user.role : 'student' },
    process.env.JWT_SECRET || 'biblio-controle-secret-key',
    { expiresIn: '24h' }
  );
};

/**
 * POST /api/auth/login - Login de administrador
 */
const login = async (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Buscar admin
    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isValid = await admin.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar se está ativo
    if (!admin.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Conta desativada'
      });
    }

    // Atualizar último acesso
    admin.ultimoAcesso = new Date();
    await admin.save();

    // Gerar token
    const token = generateToken(admin);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register - Criar novo administrador
 */
const register = async (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = createAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, nome } = value;

    // Verificar se email já existe
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Criar admin
    const admin = await Admin.create({ email, password, nome });

    // Gerar token
    const token = generateToken(admin);

    res.status(201).json({
      success: true,
      message: 'Administrador criado com sucesso',
      data: {
        token,
        admin: admin.toJSON()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me - Obter dados do admin logado
 */
const getMe = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'student') {
      return res.json({
        success: true,
        data: { user: req.user, role: 'student' }
      });
    }
    res.json({
      success: true,
      data: { admin: req.admin.toJSON(), role: req.admin.role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/student-login - Login de aluno
 */
const studentLogin = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, password } = value;
    const { User } = require('../models');

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Email ou senha incorretos' });
    }

    // Gerar token de estudante
    const token = generateToken(user, 'student');

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: user.toJSON(),
        role: 'student'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe, studentLogin };