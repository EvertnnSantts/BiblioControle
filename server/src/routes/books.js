const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// GET /api/books - Listar livros
router.get('/', authenticate, requireAdmin, bookController.getAllBooks);

// GET /api/books/stats - Estatísticas
router.get('/stats', authenticate, requireAdmin, bookController.getStats);

// GET /api/books/generos - Listar gêneros
router.get('/generos', authenticate, requireAdmin, bookController.getGeneros);

// GET /api/books/autores - Listar autores
router.get('/autores', authenticate, requireAdmin, bookController.getAutores);

// GET /api/books/:id - Obter livro por ID
router.get('/:id', authenticate, requireAdmin, bookController.getBookById);

// POST /api/books - Criar livro
router.post('/', authenticate, requireAdmin, bookController.createBook);

// PUT /api/books/:id - Atualizar livro
router.put('/:id', authenticate, requireAdmin, bookController.updateBook);

// DELETE /api/books/:id - Deletar livro
router.delete('/:id', authenticate, requireAdmin, bookController.deleteBook);

module.exports = router;