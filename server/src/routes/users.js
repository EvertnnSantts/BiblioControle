const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

// GET /api/users - Listar usuários
router.get('/', authenticate, requireAdmin, userController.getAllUsers);

// GET /api/users/search - Buscar usuários por nome, ID, email ou telefone
router.get('/search', authenticate, requireAdmin, userController.searchUsers);

// GET /api/users/cursos - Listar cursos
router.get('/cursos', authenticate, requireAdmin, userController.getCursos);

// GET /api/users/turmas - Listar turmas distintas
router.get('/turmas', authenticate, requireAdmin, userController.getTurmas);

// GET /api/users/:id - Obter usuário por ID
router.get('/:id', authenticate, requireAdmin, userController.getUserById);

// POST /api/users - Criar usuário
router.post('/', authenticate, requireAdmin, userController.createUser);

// PUT /api/users/:id - Atualizar usuário
router.put('/:id', authenticate, requireAdmin, userController.updateUser);

// DELETE /api/users/:id - Deletar usuário (somente Admin Geral)
router.delete('/:id', authenticate, requireSuperAdmin, userController.deleteUser);

// POST /api/users/:id/block - Bloquear usuário
router.post('/:id/block', authenticate, requireAdmin, userController.blockUser);

module.exports = router;