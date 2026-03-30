const jwt = require('jsonwebtoken');
const { Admin } = require('../models');
const { loginSchema, createAdminSchema } = require('../utils/validations');

/**
 * Gerar token JWT
 */
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, email: admin.email },
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
    res.json({
      success: true,
      data: { admin: req.admin.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe };