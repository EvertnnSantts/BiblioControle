const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

// Rotas de Lista
router.post('/lists', authenticate, attendanceController.createList);
router.get('/lists', authenticate, attendanceController.getLists);
router.get('/lists/:id', authenticate, attendanceController.getListById);
router.delete('/lists/:id', authenticate, attendanceController.deleteList);

// Rotas de Registros (Records)
router.post('/records/entry', authenticate, attendanceController.registerEntry);
router.post('/records/:id/exit', authenticate, attendanceController.registerExit);
router.post('/records/:id/admin-exit', authenticate, attendanceController.adminRegisterExit);

module.exports = router;
