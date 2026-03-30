const { User, BlockedUser, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createUserSchema, updateUserSchema, blockUserSchema } = require('../utils/validations');

/**
 * GET /api/users - Listar todos os usuários
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, curso } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    
    // Filtro de busca
    if (search) {
      where[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { matricula: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por curso
    if (curso) {
      where.curso = curso;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: {
        users,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/search - Buscar usuários por nome, ID, email ou telefone
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Termo de busca deve ter pelo menos 2 caracteres'
      });
    }

    // Buscar por nome, ID, email ou telefone
    const users = await User.findAll({
      where: {
        ativo: true,
        [Op.or]: [
          { id: parseInt(q) || 0 },
          { nome: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
          { telefone: { [Op.like]: `%${q}%` } },
          { matricula: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 20,
      order: [['nome', 'ASC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id - Obter usuário por ID
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users - Criar novo usuário
 */
const createUser = async (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Verificar se email já existe
    const existingEmail = await User.findOne({ where: { email: value.email } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email já cadastrado'
      });
    }

    // Verificar se matrícula já existe
    const existingMatricula = await User.findOne({ where: { matricula: value.matricula } });
    if (existingMatricula) {
      return res.status(409).json({
        success: false,
        message: 'Matrícula já cadastrada'
      });
    }

    // Verificar se está bloqueado
    const blocked = await BlockedUser.findOne({ 
      where: { 
        email: value.email,
        telefone: value.telefone
      } 
    });
    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Usuário bloqueado. Entre em contato com a biblioteca.'
      });
    }

    // Criar usuário
    const user = await User.create(value);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id - Atualizar usuário
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar
    await user.update(value);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/users/:id - Deletar usuário
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users/:id/block - Bloquear usuário
 */
const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = blockUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Criar registro de bloqueio
    await BlockedUser.create({
      email: user.email,
      telefone: user.telefone,
      motivo: value.motivo,
      bloqueadoPor: req.admin?.id
    });

    // Desativar usuário
    user.ativo = false;
    await user.save();

    res.json({
      success: true,
      message: 'Usuário bloqueado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/cursos - Listar cursos distintos
 */
const getCursos = async (req, res, next) => {
  try {
    const cursos = await User.findAll({
      attributes: ['curso'],
      group: ['curso'],
      order: [['curso', 'ASC']]
    });

    res.json({
      success: true,
      data: { cursos: cursos.map(c => c.curso) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/turmas - Listar turmas distintas (baseado nos cadastros dos alunos)
 */
const getTurmas = async (req, res, next) => {
  try {
    const turmas = await User.findAll({
      attributes: ['turma'],
      where: {
        turma: {
          [Op.ne]: null
        }
      },
      group: ['turma'],
      order: [['turma', 'ASC']]
    });

    res.json({
      success: true,
      data: { turmas: turmas.map(t => t.turma).filter(Boolean) }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  searchUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  blockUser,
  getCursos,
  getTurmas
};