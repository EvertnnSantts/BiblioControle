const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Rotas de Lista
router.post('/lists', authenticate, requireAdmin, attendanceController.createList);
router.get('/lists', authenticate, requireAdmin, attendanceController.getLists);
router.get('/lists/:id', authenticate, requireAdmin, attendanceController.getListById);
router.delete('/lists/:id', authenticate, requireAdmin, attendanceController.deleteList);

// Rotas de Registros (Records)
router.post('/records/entry', authenticate, requireAdmin, attendanceController.registerEntry);
router.post('/records/:id/exit', authenticate, requireAdmin, attendanceController.registerExit);
router.post('/records/:id/admin-exit', authenticate, requireAdmin, attendanceController.adminRegisterExit);

module.exports = router;
