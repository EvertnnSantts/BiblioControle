// configuração express:
const express = require('express');
const router = express.Router();
// configuração do banco de dados:
const mysql = require('mysql2/promise');


//arquivo em teste:
//const PORT = process.env.PORT || 5000;

//configuração do banco para fazer auteticação de usuario de adms:
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '82937061',
  database: 'bibliotecav',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// rota principal:
router.get('/', (req, res) => {
  res.render('LoginAdm');
});

// rota de enviar req para o banco
router.post('/Login', async (req, res) => {
  const { email, senha } = req.body;
  const query = 'SELECT * FROM loginadmdbs WHERE email = ? AND senha = ?';
  try {
    const [rows, fields] = await pool.execute(query, [email, senha]);
    console.log('Conexao ' + query);
    if (rows.length > 0) {
       res.redirect('/BiblioControle');
    } else {
      //res.send('Usuario não cadastrado');
      res.render('LoginAdm', { message: 'Verifique seu email ou senha, por favor' });
    }
  } catch (error) {
    console.error('Erro ao executar a consulta:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

module.exports = router;
