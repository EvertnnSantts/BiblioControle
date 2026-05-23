const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const { authenticate } = require('../middleware/auth');

// GET /api/books - Listar livros
router.get('/', authenticate, bookController.getAllBooks);

// GET /api/books/stats - Estatísticas
router.get('/stats', authenticate, bookController.getStats);

// GET /api/books/generos - Listar gêneros
router.get('/generos', authenticate, bookController.getGeneros);

// GET /api/books/autores - Listar autores
router.get('/autores', authenticate, bookController.getAutores);

// GET /api/books/:id - Obter livro por ID
router.get('/:id', authenticate, bookController.getBookById);

// POST /api/books - Criar livro
router.post('/', authenticate, bookController.createBook);

// PUT /api/books/:id - Atualizar livro
router.put('/:id', authenticate, bookController.updateBook);

// DELETE /api/books/:id - Deletar livro
router.delete('/:id', authenticate, bookController.deleteBook);

module.exports = router;