const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

// GET /api/users - Listar usuários
router.get('/', authenticate, userController.getAllUsers);

// GET /api/users/search - Buscar usuários por nome, ID, email ou telefone
router.get('/search', authenticate, userController.searchUsers);

// GET /api/users/cursos - Listar cursos
router.get('/cursos', authenticate, userController.getCursos);

// GET /api/users/turmas - Listar turmas distintas
router.get('/turmas', authenticate, userController.getTurmas);

// GET /api/users/:id - Obter usuário por ID
router.get('/:id', authenticate, userController.getUserById);

// POST /api/users - Criar usuário
router.post('/', authenticate, userController.createUser);

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', authenticate, userController.updateUser);

// DELETE /api/users/:id - Deletar usuário
router.delete('/:id', authenticate, userController.deleteUser);

// POST /api/users/:id/block - Bloquear usuário
router.post('/:id/block', authenticate, userController.blockUser);

module.exports = router;