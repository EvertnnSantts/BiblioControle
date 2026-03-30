const { Loan, Book, User, BlockedUser, sequelize } = require('../models');
const { createLoanSchema, returnLoanSchema } = require('../utils/validations');
const { Op } = require('sequelize');

/**
 * GET /api/loans - Listar todos os empréstimos
 */
const getAllLoans = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId, bookId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    const { count, rows: loans } = await Loan.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Book, as: 'book', attributes: ['id', 'titulo', 'autor'] },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email', 'matricula', 'ativo'] }
      ]
    });

    res.json({
      success: true,
      data: {
        loans,
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
 * GET /api/loans/active - Listar empréstimos ativos
 */
const getActiveLoans = async (req, res, next) => {
  try {
    const loans = await Loan.findAll({
      where: { status: 'ativo' },
      order: [['dataPrevista', 'ASC']],
      include: [
        { model: Book, as: 'book', attributes: ['id', 'titulo', 'autor'] },
        { model: User, as: 'user', attributes: ['id', 'nome', 'email', 'matricula', 'telefone'] }
      ]
    });

    // Verificar atrasos
    const hoje = new Date();
    const loansWithStatus = loans.map(loan => {
      const isAtrasado = new Date(loan.dataPrevista) < hoje;
      return {
        ...loan.toJSON(),
        isAtrasado
      };
    });

    res.json({
      success: true,
      data: { loans: loansWithStatus }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/loans - Criar novo empréstimo
 */
const createLoan = async (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = createLoanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { bookId, userId, dataPrevista, turma, observacao } = value;

    // Verificar livro
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // Verificar disponibilidade baseada na quantidade
    const emprestimosAtivos = await Loan.count({
      where: { bookId, status: 'ativo' }
    });
    const disponivel = book.quantidade - emprestimosAtivos;

    if (disponivel <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Livro não disponível. Todos os exemplares estão emprestados.'
      });
    }

    // Verificar usuário
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (!user.ativo) {
      return res.status(400).json({
        success: false,
        message: 'Usuário está inativo'
      });
    }

    // Verificar se está bloqueado
    const blocked = await BlockedUser.findOne({
      where: {
        [Op.or]: [
          { email: user.email },
          { telefone: user.telefone }
        ]
      }
    });

    if (blocked) {
      return res.status(403).json({
        success: false,
        message: 'Usuário está bloqueado'
      });
    }

    // Usar turma do usuário automaticamente
    const turmaUsuario = user.turma || turma;

    // Criar empréstimo
    const loan = await Loan.create({
      bookId,
      userId,
      dataPrevista,
      dataEmprestimo: new Date(),
      turma: turmaUsuario,
      observacao,
      status: 'ativo'
    });

    // Atualizar situação do livro apenas se todos os exemplares estiverem emprestados
    const novoTotalEmprestados = emprestimosAtivos + 1;
    if (novoTotalEmprestados >= book.quantidade) {
      book.situacao = 'reservado';
    }
    await book.save();

    // Buscar dados completos
    const loanWithRelations = await Loan.findByPk(loan.id, {
      include: [
        { model: Book, as: 'book' },
        { model: User, as: 'user' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Empréstimo realizado com sucesso',
      data: { loan: loanWithRelations }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/loans/:id/return - Devolução de livro
 */
const returnLoan = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = returnLoanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const loan = await Loan.findByPk(id, {
      include: [
        { model: Book, as: 'book' },
        { model: User, as: 'user' }
      ]
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Empréstimo não encontrado'
      });
    }

    if (loan.status !== 'ativo') {
      return res.status(400).json({
        success: false,
        message: 'Empréstimo já foi devolvido'
      });
    }

    // Verificar se está atrasado
    const hoje = new Date();
    const dataPrevista = new Date(loan.dataPrevista);
    const isAtrasado = hoje > dataPrevista;

    // Atualizar empréstimo
    loan.status = isAtrasado ? 'atrasado' : 'devolvido';
    loan.dataDevolucao = hoje;
    if (value.observacao) {
      loan.observacao = (loan.observacao || '') + ' | Devolução: ' + value.observacao;
    }
    await loan.save();

    // Atualizar livro - recalcular situação baseada na quantidade
    const book = await Book.findByPk(loan.bookId);
    const emprestimosAtivosRestantes = await Loan.count({
      where: {
        bookId: loan.bookId,
        status: 'ativo',
        id: { [Op.ne]: loan.id } // Excluir o empréstimo atual
      }
    });

    // Se ainda há exemplares emprestados, mantém 'reservado', senão volta para 'disponivel'
    if (emprestimosAtivosRestantes < book.quantidade) {
      book.situacao = 'disponivel';
    }
    await book.save();

    // Desbloquear automaticamente o usuário após devolução
    const user = await User.findByPk(loan.userId);
    if (user && !user.ativo) {
      // Verificar se o usuário tem outros empréstimos ativos
      const outrosEmprestimosAtivos = await Loan.count({
        where: {
          userId: loan.userId,
          status: 'ativo',
          id: { [Op.ne]: loan.id }
        }
      });
      
      // Se não tiver outros empréstimos ativos, desbloqueia
      if (outrosEmprestimosAtivos === 0) {
        user.ativo = true;
        await user.save();
      }
    }

    res.json({
      success: true,
      message: isAtrasado 
        ? 'Livro devolvido com atraso' 
        : 'Livro devolvido com sucesso',
      data: { loan }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loans/stats - Estatísticas de empréstimos
 */
const getStats = async (req, res, next) => {
  try {
    const total = await Loan.count();
    const ativos = await Loan.count({ where: { status: 'ativo' } });
    const devolvidos = await Loan.count({ where: { status: 'devolvido' } });
    const atrasados = await Loan.count({ where: { status: 'atrasado' } });

    // Contar usuários com empréstimos ativos
    const usuariosComEmprestimos = await Loan.count({
      where: { status: 'ativo' },
      distinct: true,
      col: 'userId'
    });

    res.json({
      success: true,
      data: {
        total,
        ativos,
        devolvidos,
        atrasados,
        usuariosComEmprestimos
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/loans/turmas - Listar turmas distintas
 */
const getTurmas = async (req, res, next) => {
  try {
    const turmas = await Loan.findAll({
      attributes: ['turma'],
      where: { turma: { [Op.ne]: null } },
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
  getAllLoans,
  getActiveLoans,
  createLoan,
  returnLoan,
  getStats,
  getTurmas
};