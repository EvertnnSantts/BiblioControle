const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const loanController = require('../controllers/loanController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// GET /api/loans - Listar empréstimos
router.get('/', authenticate, loanController.getAllLoans);

// GET /api/loans/active - Listar ativos
router.get('/active', authenticate, loanController.getActiveLoans);

// GET /api/loans/stats - Estatísticas
router.get('/stats', authenticate, loanController.getStats);

// GET /api/loans/turmas - Listar turmas
router.get('/turmas', authenticate, loanController.getTurmas);

// POST /api/loans - Criar empréstimo
router.post('/', authenticate, [
  body('bookId').isInt({ min: 1 }).withMessage('ID do livro inválido'),
  body('userId').isInt({ min: 1 }).withMessage('ID do usuário inválido'),
  body('dataPrevista').isISO8601().withMessage('Data prevista inválida')
], validate, loanController.createLoan);

// POST /api/loans/:id/return - Devolução
router.post('/:id/return', authenticate, loanController.returnLoan);

module.exports = router;