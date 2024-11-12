const express = require('express');
const router = express.Router();
const SaidaLivroDB = require('../models/SaidaLivroDB');
const CadastroLivroDB = require('../models/CadastroLivroDB');
const CadastroUsuarioDB = require('../models/Cadastrousuariodb');

// Função para validar os campos obrigatórios
function validarCamposObrigatorios(req, res, next) {
    const { titulosaida, ids, usuario, telefonesaida, enderecosaida, cursosaida, turma } = req.body;
    if (!titulosaida || !ids || !usuario || !telefonesaida || !enderecosaida || !cursosaida || !turma) {
        return res.status(200).send("Por favor, preencha todos os campos."); 
    }
    next();
}

// Rota para registrar a saída de livro
router.post('/', validarCamposObrigatorios, async (req, res) => {
    try {
        const { titulosaida, ids, usuario, telefonesaida, enderecosaida, cursosaida, turma } = req.body;

        // Verificar se o usuário existe
        const usuarioEncontrado = await CadastroUsuarioDB.findOne({
            where: {
                nome: usuario,
                telefone: telefonesaida,
                endereco: enderecosaida
            }
        });
        if (!usuarioEncontrado) {
            return res.status(400).json({ error: 'Usuário não encontrado ou detalhes incorretos' });
        }

        // Remover o livro do cadastro
        const livroExcluido = await CadastroLivroDB.destroy({
            where: {
                id: ids,
                titulocad: titulosaida
            }
        });
        console.log(`Removido ${livroExcluido} linha(s) da tabelaOriginal`);

        // Adicionar a tabela de saída de livro
        const saidaCriada = await SaidaLivroDB.create({
            titulosaida,
            ids,
            usuario,
            telefonesaida,
            enderecosaida,
            cursosaida,
            turma
        });

        res.send('Sucesso');
    } catch (error) {
        console.error('Erro ao registrar saída de livro:', error);
        res.status(500).json({ error: 'Erro ao registrar saída' });
    }
});

module.exports = router;
