// =configuraçao express:
const express  = require('express');
const router = express.Router();

//conexao banco de dados:
const bloqueiousuarioDB = require('../models/BloqueioUsuariosDB');
///const Usuarios = require('../models/CadastrousuarioDB');

//rotas:
router.post('/', (req, res) =>{
    const {bloqueioemail, bloqueiotelefone} = req.body;
    if(!bloqueioemail || !bloqueiotelefone){
        res.status(400).json({error: 'campos obrigatorio ausentes'});
    }else{
        Usuarios.destroy({
            where: {
                email: bloqueioemail,
                telefone: bloqueiotelefone
         }
      })
      return bloqueiousuarioDB.create({
        email: bloqueioemail, 
        telefone: bloqueiotelefone,
      }).then(() => {
        res.send('Sucesso');
      }) .catch(erro => {
        console.error('Erro ao registrar saída de livro:', erro);
        res.status(500).json({ error: 'Erro ao registrar saída' });
    });
    }
})

module.exports = router;