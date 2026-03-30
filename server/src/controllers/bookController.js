const { Book, Loan, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createBookSchema, updateBookSchema } = require('../utils/validations');

/**
 * GET /api/books - Listar todos os livros
 */
const getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, genero, autor, situacao } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Filtro de busca
    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { autor: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtros
    if (genero && genero !== 'todos') {
      where.genero = genero;
    }

    if (autor && autor !== 'todos') {
      where.autor = autor;
    }

    if (situacao) {
      where.situacao = situacao;
    }

    const { count, rows: books } = await Book.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // Calcular quantidade disponível para cada livro
    const booksWithAvailability = await Promise.all(books.map(async (book) => {
      const emprestimosAtivos = await Loan.count({
        where: { bookId: book.id, status: 'ativo' }
      });
      const disponivel = Math.max(0, book.quantidade - emprestimosAtivos);
      return {
        ...book.toJSON(),
        quantidadeDisponivel: disponivel,
        emprestimosAtivos
      };
    }));

    res.json({
      success: true,
      data: {
        books: booksWithAvailability,
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
 * GET /api/books/:id - Obter livro por ID
 */
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    res.json({
      success: true,
      data: { book }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/books - Criar novo livro
 */
const createBook = async (req, res, next) => {
  try {
    // Validar dados
    const { error, value } = createBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    // Normalizar dados para uppercase (com verificação de null/undefined)
    const normalizedData = {
      titulo: value.titulo ? value.titulo.toUpperCase() : null,
      autor: value.autor ? value.autor.toUpperCase() : null,
      quantidade: value.quantidade || 1,
      estante: value.estante ? value.estante.toUpperCase() : null,
      observacao: value.observacao ? value.observacao.toUpperCase() : null,
      situacao: value.situacao || 'disponivel',
      genero: value.genero ? value.genero.toUpperCase() : null
    };

    // Criar livro
    const book = await Book.create(normalizedData);

    res.status(201).json({
      success: true,
      message: 'Livro criado com sucesso',
      data: { book }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/books/:id - Atualizar livro
 */
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    // Normalizar campos string
    if (value.titulo) value.titulo = value.titulo.toUpperCase();
    if (value.autor) value.autor = value.autor.toUpperCase();
    if (value.estante) value.estante = value.estante.toUpperCase();
    if (value.observacao) value.observacao = value.observacao.toUpperCase();
    if (value.genero) value.genero = value.genero.toUpperCase();

    // Atualizar
    await book.update(value);

    res.json({
      success: true,
      message: 'Livro atualizado com sucesso',
      data: { book }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/books/:id - Deletar livro
 */
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Livro não encontrado'
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: 'Livro deletado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/generos - Listar gêneros distintos
 */
const getGeneros = async (req, res, next) => {
  try {
    const generos = await Book.findAll({
      attributes: ['genero'],
      group: ['genero'],
      order: [['genero', 'ASC']]
    });

    res.json({
      success: true,
      data: { generos: generos.map(g => g.genero) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/autores - Listar autores distintos
 */
const getAutores = async (req, res, next) => {
  try {
    const autores = await Book.findAll({
      attributes: ['autor'],
      group: ['autor'],
      order: [['autor', 'ASC']]
    });

    res.json({
      success: true,
      data: { autores: autores.map(a => a.autor) }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/books/stats - Estatísticas dos livros
 */
const getStats = async (req, res, next) => {
  try {
    const total = await Book.count();
    const disponiveis = await Book.count({ where: { situacao: 'disponivel' } });
    const consulta = await Book.count({ where: { situacao: 'consulta' } });
    const reservados = await Book.count({ where: { situacao: 'reservado' } });

    // Contar total de empréstimos ativos
    const emprestimosAtivos = await Loan.count({ where: { status: 'ativo' } });

    res.json({
      success: true,
      data: {
        total,
        disponiveis,
        consulta,
        reservados,
        emprestimosAtivos
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getGeneros,
  getAutores,
  getStats
};