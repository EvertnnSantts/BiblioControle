const { Book, Loan, LocalConsultation, User } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/student/dashboard - Obter dados do dashboard do aluno
 */
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Obter dados do aluno atualizados
    const user = await User.findByPk(userId);

    // Empréstimos ativos
    const activeLoans = await Loan.findAll({
      where: { userId, status: { [Op.in]: ['ativo', 'atrasado'] } },
      include: [{ model: Book, as: 'book', attributes: ['titulo', 'autor'] }]
    });

    // Consultas locais ativas
    const activeConsultations = await LocalConsultation.findAll({
      where: { userId, status: { [Op.in]: ['em_consulta', 'vencida'] } },
      include: [{ model: Book, as: 'book', attributes: ['titulo', 'autor'] }]
    });

    // Histórico de empréstimos
    const loanHistory = await Loan.findAll({
      where: { userId, status: 'devolvido' },
      include: [{ model: Book, as: 'book', attributes: ['titulo', 'autor'] }],
      order: [['dataDevolucao', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        activeLoans,
        activeConsultations,
        loanHistory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/student/books - Obter catálogo de livros
 */
const getAvailableBooks = async (req, res, next) => {
  try {
    const { search, genero } = req.query;
    let where = {};
    
    if (search) {
      where[Op.or] = [
        { titulo: { [Op.iLike]: `%${search}%` } },
        { autor: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (genero) {
      where.genero = genero;
    }

    const books = await Book.findAll({
      where,
      order: [['titulo', 'ASC']]
    });

    res.json({
      success: true,
      data: { books }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getAvailableBooks };
