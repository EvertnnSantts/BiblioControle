// configuração express:
const express = require('express');
const router = express.Router();

//conexao com o banco de dados:
const loginadmbds = require('../models/LoginAdmDB')

//rota de excluir adm:
router.post('/', (req, res) =>{
    const {excluiradmemail, excluiradmsenha} = req.body;
    if(!excluiradmemail || !excluiradmsenha){
      res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }else{
      loginadmbds.destroy({
       where: {
          email: excluiradmemail,
          senha:  excluiradmsenha
       }
      }).then(() => {
        res.send('Sucesso');
      })
      .catch(erro => {
        console.error('Erro ao : excluir adm', erro);
        res.status(500).json({ error: 'Erro ao excluir adm' });
    });
 };
})

module.exports = router;