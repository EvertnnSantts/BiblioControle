// configuração express:
const express = require('express');
const router = express.Router();
const sequelize = require('sequelize')

//conexao com banco
const cadastrousuariodb = require('../models/Cadastrousuariodb');
const SaidaLivroDB = require('../models/SaidaLivroDB');

// Rota para exibir a tabela de usuários
router.get('/', async (req, res) => {
  try {
      // Consulta para obter turmas distintas
      const turmas = await SaidaLivroDB.findAll({
          attributes: [[sequelize.fn('DISTINCT', sequelize.col('turma')), 'turma']]
      });
      // Extrai apenas as turmas da consulta
      const filtroturma = turmas.map(turma => turma.turma);

      // Consulta para obter todos os registros de saída de livro
      const SaidaLivro = await SaidaLivroDB.findAll();
      const usuarios = await cadastrousuariodb.findAll();

      res.render('AdmConnect', { usuarios, SaidaLivro, filtroturma });
  } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao carregar usuários');
  }
});


module.exports = router;

