// configuração express:
const express = require('express');
const router = express.Router();
const sequelize = require('sequelize');

// Conexão com banco
const cadastrousuariodb = require('../models/Cadastrousuariodb');
const SaidaLivroDB = require('../models/SaidaLivroDB');

// Rota principal para exibir a tabela de usuários e Saída de Livro, além de permitir o cadastro
router.get('/', async (req, res) => {
  try {
    // Consulta para obter turmas distintas
    const turmas = await SaidaLivroDB.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('turma')), 'turma']]
    });
    const filtroturma = turmas.map(turma => turma.turma);

    // Consulta para obter registros de saída de livros e usuários
    const SaidaLivro = await SaidaLivroDB.findAll();
    const usuarios = await cadastrousuariodb.findAll();

    res.render('UserConnect', { usuarios, SaidaLivro, filtroturma, message: null }); // Renderiza com message nula inicialmente
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao carregar informações');
  }
});

// Rota para adicionar um novo usuário
router.post('/', async (req, res) => {
  const { nome, email, senha, telefone, endereco, matricula, curso } = req.body;

  if (!nome || !email || !senha || !telefone || !endereco || !matricula || !curso) {
    // Recarregar a página com uma mensagem de erro
    const usuarios = await cadastrousuariodb.findAll();
    const SaidaLivro = await SaidaLivroDB.findAll();
    const turmas = await SaidaLivroDB.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('turma')), 'turma']]
    });
    const filtroturma = turmas.map(turma => turma.turma);
    
    return res.render('UserConnect', { usuarios, SaidaLivro, filtroturma, message: 'Campos obrigatórios ausentes' });
  }

  // Função para formatar o número de telefone
  function formatPhoneNumber(phoneNumber) {
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
  }

  const nomeUperr = nome.toUpperCase();
  const enderecoUpper = endereco.toUpperCase();
  const cursoUpper = curso.toUpperCase();
  const telefoneFormatado = formatPhoneNumber(telefone);

  try {
    await cadastrousuariodb.create({
      nome: nomeUperr,
      email: email,
      senha: senha,
      telefone: telefoneFormatado,
      endereco: enderecoUpper,
      matricula: matricula,
      curso: cursoUpper
    });

    // Após criar o usuário, recarregar a página com a lista atualizada de usuários
    const usuarios = await cadastrousuariodb.findAll();
    const SaidaLivro = await SaidaLivroDB.findAll();
    const turmas = await SaidaLivroDB.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('turma')), 'turma']]
    });
    const filtroturma = turmas.map(turma => turma.turma);

    res.render('UserConnect', { usuarios, SaidaLivro, filtroturma, message: `Usuário "${nome}" cadastrado com sucesso!` });
  } catch (error) {
    console.error(error);
    const usuarios = await cadastrousuariodb.findAll();
    const SaidaLivro = await SaidaLivroDB.findAll();
    const turmas = await SaidaLivroDB.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('turma')), 'turma']]
    });
    const filtroturma = turmas.map(turma => turma.turma);

    res.render('UserConnect', { usuarios, SaidaLivro, filtroturma, message: `Erro ao criar o registro do usuário ${nome}.` });
  }
});

module.exports = router;
