// ALTERAÇÕES:
// 1. Op.like → Op.iLike em todas as buscas de texto
//    Motivo: MySQL faz LIKE case-insensitive por padrão; PostgreSQL não.
//    Op.iLike usa ILIKE do Postgres, equivalente ao comportamento anterior.

const { Book, Loan, LocalConsultation, sequelize } = require('../models');
const { Op } = require('sequelize');
const { createBookSchema, updateBookSchema } = require('../utils/validations');
const crypto = require('crypto');

const getAllBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, genero, autor, situacao } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        // ALTERADO: Op.like → Op.iLike (case-insensitive no PostgreSQL)
        { titulo: { [Op.iLike]: `%${search}%` } },
        { autor: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (genero && genero !== 'todos') where.genero = genero;
    if (autor && autor !== 'todos') where.autor = autor;
    if (situacao) where.situacao = situacao;

    const { count, rows: books } = await Book.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const booksWithAvailability = await Promise.all(books.map(async (book) => {
      const emprestimosAtivos = await Loan.count({
        where: { bookId: book.id, status: 'ativo' }
      });
      const consultaAtiva = await LocalConsultation.findOne({
        where: { bookId: book.id, status: 'em_consulta' }
      });
      const disponivel = Math.max(0, book.quantidade - emprestimosAtivos);
      const consultaLocal = book.situacao === 'consulta';
      return { 
        ...book.toJSON(), 
        quantidadeDisponivel: consultaLocal ? book.quantidade : disponivel,
        emprestimosAtivos,
        consultaLocal,
        consultaAtiva: !!consultaAtiva
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

const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }
    res.json({ success: true, data: { book } });
  } catch (error) {
    next(error);
  }
};

const createBook = async (req, res, next) => {
  try {
    const { error, value } = createBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const normalizedData = {
      titulo: value.titulo?.toUpperCase() ?? null,
      autor: value.autor?.toUpperCase() ?? null,
      quantidade: value.quantidade || 1,
      estante: value.estante?.toUpperCase() ?? null,
      observacao: value.observacao?.toUpperCase() ?? null,
      situacao: value.situacao || 'disponivel',
      genero: value.genero?.toUpperCase() ?? null
    };

    const book = await Book.create(normalizedData);
    res.status(201).json({ success: true, message: 'Livro criado com sucesso', data: { book } });
  } catch (error) {
    next(error);
  }
};

const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error, value } = updateBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    if (value.titulo) value.titulo = value.titulo.toUpperCase();
    if (value.autor) value.autor = value.autor.toUpperCase();
    if (value.estante) value.estante = value.estante.toUpperCase();
    if (value.observacao) value.observacao = value.observacao.toUpperCase();
    if (value.genero) value.genero = value.genero.toUpperCase();

    await book.update(value);
    res.json({ success: true, message: 'Livro atualizado com sucesso', data: { book } });
  } catch (error) {
    next(error);
  }
};

const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;

    const book = await Book.findByPk(id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    // Bloqueia exclusão apenas se houver empréstimos ATIVOS
    const emprestimosAtivos = await Loan.count({ where: { bookId: id, status: 'ativo' } });
    if (emprestimosAtivos > 0) {
      return res.status(400).json({
        success: false,
        message: `Não é possível excluir. Este livro possui ${emprestimosAtivos} empréstimo(s) ativo(s). Devolva o(s) livro(s) antes de excluir.`
      });
    }

    // Bloqueia exclusão se houver consulta local ATIVA
    const consultasAtivas = await LocalConsultation.count({ where: { bookId: id, status: 'em_consulta' } });
    if (consultasAtivas > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir. Este livro está sendo consultado no momento. Finalize a consulta local antes de excluir.'
      });
    }

    // Deletar TODOS os empréstimos não-ativos (devolvido, atrasado, bloqueado) para liberar a FK
    await Loan.destroy({
      where: {
        bookId: id,
        status: { [Op.in]: ['devolvido', 'atrasado', 'bloqueado'] }
      }
    });

    // Deletar TODAS as consultas locais finalizadas (devolvida, vencida) para liberar a FK
    await LocalConsultation.destroy({
      where: {
        bookId: id,
        status: { [Op.in]: ['devolvida', 'vencida'] }
      }
    });

    await book.destroy();
    res.json({ success: true, message: 'Livro excluído com sucesso' });
  } catch (error) {
    next(error);
  }
};

const getGeneros = async (req, res, next) => {
  try {
    const generos = await Book.findAll({
      attributes: ['genero'],
      group: ['genero'],
      order: [['genero', 'ASC']]
    });
    res.json({ success: true, data: { generos: generos.map(g => g.genero) } });
  } catch (error) {
    next(error);
  }
};

const getAutores = async (req, res, next) => {
  try {
    const autores = await Book.findAll({
      attributes: ['autor'],
      group: ['autor'],
      order: [['autor', 'ASC']]
    });
    res.json({ success: true, data: { autores: autores.map(a => a.autor) } });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const total = await Book.count();
    const disponiveis = await Book.count({ where: { situacao: 'disponivel' } });
    const consulta = await Book.count({ where: { situacao: 'consulta' } });
    const reservados = await Book.count({ where: { situacao: 'reservado' } });
    const emprestimosAtivos = await Loan.count({ where: { status: 'ativo' } });

    res.json({
      success: true,
      data: { total, disponiveis, consulta, reservados, emprestimosAtivos }
    });
  } catch (error) {
    next(error);
  }
};

const createBulk = async (req, res, next) => {
  try {
    const { error, value } = createBookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const quantidade = value.quantidade || 1;
    const grupoExemplar = crypto.randomUUID();
    const booksToCreate = [];
    const timestamp = Date.now();

    for (let i = 1; i <= quantidade; i++) {
      const codigoBarras = `LIV-${timestamp}-${i}`;
      booksToCreate.push({
        titulo: value.titulo?.toUpperCase() ?? null,
        autor: value.autor?.toUpperCase() ?? null,
        quantidade: 1,
        quantidadeDisponivel: 1,
        estante: value.estante?.toUpperCase() ?? null,
        observacao: value.observacao?.toUpperCase() ?? null,
        situacao: value.situacao || 'disponivel',
        genero: value.genero?.toUpperCase() ?? null,
        codigoBarras,
        grupoExemplar,
        numeroExemplar: i
      });
    }

    const createdBooks = await Book.bulkCreate(booksToCreate);
    res.status(201).json({
      success: true,
      message: `${quantidade} exemplares cadastrados com sucesso.`,
      data: { books: createdBooks }
    });
  } catch (error) {
    next(error);
  }
};

const getByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const book = await Book.findOne({ where: { codigoBarras: barcode } });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Livro não encontrado' });
    }

    const emprestimosAtivos = await Loan.count({
      where: { bookId: book.id, status: 'ativo' }
    });
    const consultaAtiva = await LocalConsultation.findOne({
      where: { bookId: book.id, status: 'em_consulta' }
    });
    const disponivel = Math.max(0, book.quantidade - emprestimosAtivos);
    const consultaLocal = book.situacao === 'consulta';

    const bookWithAvailability = {
      ...book.toJSON(),
      quantidadeDisponivel: consultaLocal ? book.quantidade : disponivel,
      emprestimosAtivos,
      consultaLocal,
      consultaAtiva: !!consultaAtiva
    };

    res.json({ success: true, data: { book: bookWithAvailability } });
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
  getStats,
  createBulk,
  getByBarcode
};
