const express = require('express');
const router = express.Router();
const sequelize = require('sequelize')

//imports
const cadastrousuariodb = require('../models/Cadastrousuariodb');
const livrospendentesdb = require('../models/SaidaLivroDB');
const CadastroLivroDB = require('../models/CadastroLivroDB');
const usuariosbloqueados = require('../models/BloqueioUsuariosDB');
const administradores = require('../models/LoginAdmDB');

router.get('/', async (req, res) => {
    try {
        const [LivrosTotais, LivrosPendentes, TotalUsuarios, UsuariosBloqueados, Administradores, autoresResult, livros] = await Promise.all([
            cadastrousuariodb.count(),
            livrospendentesdb.count(),
            CadastroLivroDB.count(),
            usuariosbloqueados.count(),
            administradores.count(),
            CadastroLivroDB.findAll({
                attributes: [[sequelize.fn('DISTINCT', sequelize.col('autorcad')), 'autorcad']]
            }),
            CadastroLivroDB.findAll()
        ]);
        
        // Formatar os IDs dos livros antes de enviar para a página
        const livrosFormatados = livros.map(livro => ({
            ...livro.toJSON(),
            id: String(livro.id).padStart(6, '0')
        }));

        const autores = autoresResult.map(result => result.autorcad);
        
        res.render('Biblioteca', {
            TotalUsuarios: TotalUsuarios,
            LivrosPendentes: LivrosPendentes,
            LivrosTotais: LivrosTotais,
            UsuariosBloqueados: UsuariosBloqueados,
            Administradores: Administradores,
            autores: autores,
            livros: livrosFormatados // Enviando os livros formatados para a página
        });
        
    } catch (error) {
        console.error('Erro ao buscar dados do banco de dados:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

module.exports = router;
