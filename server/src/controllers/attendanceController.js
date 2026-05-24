const { AttendanceList, AttendanceRecord, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// Gerar código aleatório de 6 caracteres (alfanumérico)
const generateCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

/**
 * Gestão de Listas de Presença
 */
const createList = async (req, res, next) => {
  try {
    const { nome, data, turno } = req.body;
    
    if (!nome || !data || !turno) {
      return res.status(400).json({ success: false, message: 'Nome, data e turno são obrigatórios.' });
    }

    const list = await AttendanceList.create({ nome, data, turno });
    res.status(201).json({ success: true, message: 'Lista criada com sucesso', data: { list } });
  } catch (error) {
    next(error);
  }
};

const getLists = async (req, res, next) => {
  try {
    const { data, turno, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (data) where.data = data;
    if (turno) where.turno = turno;

    const { count, rows: lists } = await AttendanceList.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['data', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        lists,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getListById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const list = await AttendanceList.findByPk(id, {
      include: [
        {
          model: AttendanceRecord,
          as: 'records',
          include: [{ model: User, as: 'user', attributes: ['id', 'nome', 'matricula', 'turma'] }]
        }
      ],
      order: [[{ model: AttendanceRecord, as: 'records' }, 'horarioEntrada', 'ASC']]
    });

    if (!list) {
      return res.status(404).json({ success: false, message: 'Lista não encontrada' });
    }

    res.json({ success: true, data: { list } });
  } catch (error) {
    next(error);
  }
};

const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const list = await AttendanceList.findByPk(id);
    
    if (!list) {
      return res.status(404).json({ success: false, message: 'Lista não encontrada' });
    }

    await list.destroy();
    res.json({ success: true, message: 'Lista excluída com sucesso' });
  } catch (error) {
    next(error);
  }
};

/**
 * Gestão de Registros de Presença
 */
const registerEntry = async (req, res, next) => {
  try {
    const { attendanceListId, userId } = req.body;

    const list = await AttendanceList.findByPk(attendanceListId);
    if (!list) return res.status(404).json({ success: false, message: 'Lista não encontrada' });

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    // Verifica se já registrou entrada nesta lista
    const existing = await AttendanceRecord.findOne({ where: { attendanceListId, userId } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Usuário já registrou entrada nesta lista.' });
    }

    const codigoSaida = generateCode();

    const record = await AttendanceRecord.create({
      attendanceListId,
      userId,
      codigoSaida,
      status: 'pendente'
    });

    res.status(201).json({
      success: true,
      message: 'Entrada registrada com sucesso.',
      data: { record, codigoSaida }
    });
  } catch (error) {
    next(error);
  }
};

const registerExit = async (req, res, next) => {
  try {
    const { id } = req.params; // ID do record
    const { codigoSaida } = req.body;

    const record = await AttendanceRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: 'Registro não encontrado' });

    if (record.status !== 'pendente') {
      return res.status(400).json({ success: false, message: 'A saída já foi processada para este registro.' });
    }

    if (record.codigoSaida !== codigoSaida) {
      return res.status(400).json({ success: false, message: 'Código de saída inválido.' });
    }

    record.horarioSaida = new Date();
    record.status = 'presente';
    await record.save();

    res.json({ success: true, message: 'Saída confirmada com sucesso.', data: { record } });
  } catch (error) {
    next(error);
  }
};

const adminRegisterExit = async (req, res, next) => {
  try {
    const { id } = req.params; // ID do record

    const record = await AttendanceRecord.findByPk(id);
    if (!record) return res.status(404).json({ success: false, message: 'Registro não encontrado' });

    if (record.status !== 'pendente') {
      return res.status(400).json({ success: false, message: 'A saída já foi processada para este registro.' });
    }

    // Saída manual pelo admin
    record.horarioSaida = new Date();
    record.status = 'presente';
    await record.save();

    res.json({ success: true, message: 'Saída confirmada manualmente pelo administrador.', data: { record } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createList,
  getLists,
  getListById,
  deleteList,
  registerEntry,
  registerExit,
  adminRegisterExit
};
