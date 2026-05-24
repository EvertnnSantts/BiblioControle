const { LocalConsultation, Book, User, BlockedUser, Loan, sequelize } = require('../models');
const { createLocalConsultationSchema } = require('../utils/validations');
const { Op } = require('sequelize');

/**
 * Atualiza status de consultas vencidas
 */
const updateVencidas = async () => {
  try {
    const hoje = new Date();
    await LocalConsultation.update(
      { status: 'vencida' },
      {
        where: {
          status: 'em_consulta',
          dataExpiracao: { [Op.lt]: hoje }
        }
      }
    );
  } catch (error) {
    console.error('Erro ao atualizar consultas vencidas:', error);
  }
};

/**
 * GET /api/local-consultations - Listar todas as consultas locais
 */
const getAllConsultas = async (req, res, next) => {
  try {
    await updateVencidas();

    const { page = 1, limit = 20, status, userId, bookId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (bookId) where.bookId = bookId;

    const { count, rows: consultas } = await LocalConsultation.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Book, as: 'book', attributes: ['id', 'titulo', 'autor', 'situacao'] },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email', 'matricula', 'ativo'] }
      ]
    });

    res.json({
      success: true,
      data: {
        consultas,
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
 * GET /api/local-consultations/active - Listar consultas locais ativas
 */
const getActiveConsultas = async (req, res, next) => {
  try {
    await updateVencidas();

    const consultas = await LocalConsultation.findAll({
      where: { status: 'em_consulta' },
      order: [['dataExpiracao', 'ASC']],
      include: [
        { model: Book, as: 'book', attributes: ['id', 'titulo', 'autor'] },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email', 'matricula', 'telefone'] }
      ]
    });

    res.json({
      success: true,
      data: { consultas }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/local-consultations - Criar nova consulta local
 */
const createConsulta = async (req, res, next) => {
  try {
    await updateVencidas();

    const { error, value } = createLocalConsultationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { bookId, userId, duracaoHoras, turma, observacao } = value;

    // Verificar livro
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    // O livro precisa estar marcado como 'consulta'
    if (book.situacao !== 'consulta') {
      return res.status(400).json({ 
        success: false, 
        message: 'Este livro não está marcado para consulta local. Para empréstimo normal, use a aba de Empréstimos.' 
      });
    }

    // Verificar se já existe consulta ativa para este livro
    const consultaAtivaLivro = await LocalConsultation.findOne({
      where: { bookId, status: 'em_consulta' }
    });
    if (consultaAtivaLivro) {
      return res.status(400).json({
        success: false,
        message: 'Este livro já está em consulta local com outro usuário.'
      });
    }

    // Verificar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (!user.ativo) {
      return res.status(400).json({ success: false, message: 'Usuário está inativo' });
    }

    // Verificar se o usuário está bloqueado
    const blocked = await BlockedUser.findOne({
      where: {
        [Op.or]: [
          { email: user.email },
          { telefone: user.telefone }
        ]
      }
    });

    if (blocked) {
      return res.status(403).json({ success: false, message: 'Usuário está bloqueado' });
    }

    // Regra: usuário só pode ter 1 consulta local ativa
    const consultaAtivaUsuario = await LocalConsultation.findOne({
      where: { userId, status: 'em_consulta' }
    });
    if (consultaAtivaUsuario) {
      return res.status(400).json({
        success: false,
        message: 'O usuário já possui uma consulta local ativa.'
      });
    }

    // Regra: usuário com empréstimo ativo não pode abrir consulta local
    const emprestimoAtivoUsuario = await Loan.findOne({
      where: { userId, status: 'ativo' }
    });
    if (emprestimoAtivoUsuario) {
      return res.status(400).json({
        success: false,
        message: 'O usuário já possui um empréstimo ativo. Não é possível iniciar uma consulta local.'
      });
    }

    const agora = new Date();
    const dataExpiracao = new Date(agora.getTime() + duracaoHoras * 60 * 60 * 1000);

    const consulta = await LocalConsultation.create({
      bookId,
      userId,
      dataRetirada: agora,
      dataExpiracao,
      duracaoHoras,
      turma: user.turma || turma,
      observacao,
      status: 'em_consulta'
    });

    const consultaWithRelations = await LocalConsultation.findByPk(consulta.id, {
      include: [
        { model: Book, as: 'book' },
        { model: User, as: 'user' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Consulta local iniciada com sucesso',
      data: { consulta: consultaWithRelations }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/local-consultations/:id/return - Devolução da consulta local
 */
const returnConsulta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observacao } = req.body;

    const consulta = await LocalConsultation.findByPk(id);

    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta local não encontrada' });
    }

    if (consulta.status === 'devolvida') {
      return res.status(400).json({ success: false, message: 'Consulta já foi devolvida' });
    }

    consulta.status = 'devolvida';
    consulta.dataDevolucao = new Date();
    if (observacao) {
      consulta.observacao = (consulta.observacao || '') + ' | Devolução: ' + observacao;
    }

    await consulta.save();

    res.json({
      success: true,
      message: 'Consulta local encerrada com sucesso',
      data: { consulta }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/local-consultations/stats - Estatísticas
 */
const getStats = async (req, res, next) => {
  try {
    await updateVencidas();

    const total = await LocalConsultation.count();
    const ativas = await LocalConsultation.count({ where: { status: 'em_consulta' } });
    const devolvidas = await LocalConsultation.count({ where: { status: 'devolvida' } });
    const vencidas = await LocalConsultation.count({ where: { status: 'vencida' } });

    res.json({
      success: true,
      data: { total, ativas, devolvidas, vencidas }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllConsultas,
  getActiveConsultas,
  createConsulta,
  returnConsulta,
  getStats
};
