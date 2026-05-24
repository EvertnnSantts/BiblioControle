const jwt = require('jsonwebtoken');
const { Admin } = require('../models');

/**
 * Middleware para verificar token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'biblio-controle-secret-key');

    if (decoded.role === 'student') {
      const { User } = require('../models');
      const user = await User.findByPk(decoded.id);
      if (!user || !user.ativo) {
        return res.status(401).json({ success: false, message: 'Usuário não encontrado ou inativo' });
      }
      req.user = user;
    } else {
      const admin = await Admin.findByPk(decoded.id);
      if (!admin || !admin.ativo) {
        return res.status(401).json({ success: false, message: 'Admin não encontrado ou inativo' });
      }
      req.admin = admin;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.admin) {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores e assistentes' });
  }
  next();
};

const requireSuperAdmin = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acesso restrito a administradores gerais' });
  }
  next();
};

/**
 * Middleware opcional - não falha se não tiver token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'biblio-controle-secret-key');
    const admin = await Admin.findByPk(decoded.id);
    
    if (admin && admin.ativo) {
      req.admin = admin;
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth, requireAdmin, requireSuperAdmin };