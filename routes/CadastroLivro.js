const express = require('express');
const router = express.Router();
const CadastroLivroDB = require('../models/CadastroLivroDB');

router.get('/', (req, res) =>{
  res.render('BiblioControle');
});

router.post('/', (req, res) => {
  const { titulocad, autorcad, quantidadecad, estantecad, observacaocad, situacaocad, generocad } = req.body;

  // Verifica se os campos obrigatórios estão presentes
  if (!titulocad || !autorcad || !quantidadecad || !estantecad || !observacaocad || !situacaocad || !generocad) {
   return res.status(200).send("Por favor, preencha todos os campos."); 
  }

  //esta convertendo os valores de minusculo para MAIUSCULO
  const titulocadUpper = titulocad.toUpperCase();
  const autorcadUpper = autorcad.toUpperCase();
  const quantidadecadUpper = quantidadecad.toUpperCase();
  const estantecadUpper = estantecad.toUpperCase();
  const observacaocadUpper = observacaocad.toUpperCase();
  const situacaocadUpper = situacaocad.toUpperCase();
  const generocadUpper = generocad.toUpperCase();

  // Cria um novo registro de livro no banco de dados
  CadastroLivroDB.create({
    titulocad: titulocadUpper,
    autorcad: autorcadUpper,
    quantidadecad: quantidadecadUpper,
    estantecad: estantecadUpper,
    observacaocad: observacaocadUpper,
    situacaocad: situacaocadUpper,
    generocad: generocadUpper
  }).then(() => {
    // Renderiza a página novamente sem a mensagem
    res.render('BiblioControle');
  }).catch((erro) => {
    console.error(erro);
    res.status(500).send("Erro ao cadastrar livro. Por favor, tente novamente."); 
  });
});

module.exports = router;

