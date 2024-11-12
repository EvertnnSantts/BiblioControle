// configuração express:
const express = require('express');
const { message } = require('statuses');
const router = express.Router();

const cadastrousuariodb = require('../models/Cadastrousuariodb');
const livrospendentesdb = require('../models/SaidaLivroDB');
const livrostotais = require('../models/CadastroLivroDB');
const usuariosbloqueados = require('../models/BloqueioUsuariosDB');
const bloqueiousuario =  require('../models/BloqueioUsuariosDB');
const administradores = require('../models/LoginAdmDB');

// Rota principal
router.get('/', async (req, res) => {
  try {
    const [TotalUsuarios, LivrosPendentes, LivrosTotais, UsuariosBloqueados, ] = await Promise.all([
      cadastrousuariodb.count(),
      livrospendentesdb.count(),
      livrostotais.count(),
      usuariosbloqueados.count(),
      bloqueiousuario.count(),
      administradores.count()
    ]);
    res.render('BiblioControle', {
      TotalUsuarios: TotalUsuarios,
      LivrosPendentes: LivrosPendentes,
      LivrosTotais: LivrosTotais,
      UsuariosBloqueados: UsuariosBloqueados
    });
  } catch (error) {
    console.error('Erro ao buscar dados do banco de dados:', error);
    res.status(500).send('Erro interno do servidor');
  }
});
router.post('cadastrolivro', (req, res) =>{

})

module.exports = router;
