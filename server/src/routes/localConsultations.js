const express = require('express');
const router = express.Router();
const localConsultationController = require('../controllers/localConsultationController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// GET /api/local-consultations - Listar consultas
router.get('/', authenticate, localConsultationController.getAllConsultas);

// GET /api/local-consultations/active - Listar ativas
router.get('/active', authenticate, localConsultationController.getActiveConsultas);

// GET /api/local-consultations/stats - Estatísticas
router.get('/stats', authenticate, localConsultationController.getStats);

// POST /api/local-consultations - Criar consulta local
router.post('/', authenticate, validate, localConsultationController.createConsulta);

// POST /api/local-consultations/:id/return - Devolução
router.post('/:id/return', authenticate, localConsultationController.returnConsulta);

module.exports = router;
