// configuração express:
const express = require('express');
const router = express.Router();

//conexao com o banco de dados:
const loginadmbds = require('../models/LoginAdmDB')
//rota de adicionar um novo adm:
router.post('/', (req, res) =>{
    const {adicionaradmemail, adicionaradmsenha} = req.body;
    if(!adicionaradmemail || !adicionaradmsenha){
      res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }else{
      loginadmbds.create({
        email: req.body.adicionaradmemail,
        senha: req.body.adicionaradmsenha
      }).then(() => {
        res.send('Sucesso');
      })
      .catch(erro => {
        console.error('Erro ao adicionar adm:', erro);
        res.status(500).json({ error: 'Erro ao adicionar adm' });
      });
    };
})
  
module.exports = router;
