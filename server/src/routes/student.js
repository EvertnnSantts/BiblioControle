const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Rotas do aluno
router.get('/dashboard', authenticate, studentController.getDashboard);
router.get('/books', authenticate, studentController.getAvailableBooks);

module.exports = router;
