const express = require('express');
const router = express.Router();
const CadastroLivroDB = require('../models/CadastroLivroDB');
const SaidaLivroDB = require('../models/SaidaLivroDB');

function validarCamposObrigatorios(req, res, next) {
    const { titulo, autor, fileira, estante, observacao, clasificacao, epecon, usuario } = req.body;
    if (!titulo || !autor || !fileira || !estante || !observacao || !clasificacao || !epecon || !usuario) {
        return res.status(200).send("Por favor, preencha todos os campos."); 
    }
    next();
}

router.post('/', validarCamposObrigatorios, async (req, res) => {
    try {
        const { titulo, usuario } = req.body;

        // Deletar o livro da tabela de saída
        await SaidaLivroDB.destroy({
            where: {
                titulosaida: titulo,
                usuario: usuario
            }
        });

        const titulocadUpper = titulocad.toUpperCase();
        const autorcadUpper = autocad.toUppperCase();
        const fileiracadUpper = fileira.toUpperCase();
        const estantecadUpper = estante.toUpperCase();
        const observacaocadUpper = observacaocad.toUpperCase();
        const generocadUpper = generocad.toUpperCase();
        const situacaocadUpper = situacaocad.toUpperCase();

        // Adicionar os livros na tabela de cadastro de livros
        await CadastroLivroDB.create({
            titulocad: titulocadUpper,
            autorcad: autorcadUpper,
            fileiracad: fileiracadUpper,
            estantecad: estantecadUpper,
            observacaocad: observacaocadUpper,
            generocad: generocadUpper,
            situacaocad: situacaocadUpper
        });

        return res.send('Sucesso');
    } catch (error) {
        console.error('Erro ao registrar entrada de livro:', error);
        return res.status(500).send('Erro ao registrar entrada de livro');
    }
});

module.exports = router;

