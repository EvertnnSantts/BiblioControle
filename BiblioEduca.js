// Configuração do express:
const express = require('express');
const expressApp = express();
const bodyParser = require('body-parser');
const path = require('path'); 
const Sequelize = require('sequelize');
const expressPort = 5000;
const ejs = require('ejs');
const router = express.Router();

expressApp.use(express.urlencoded({ extended: true }));
// Configuração para renderizar HTML, CSS no Express
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use('/public', express.static(path.join(__dirname, 'public')));
// Configuração do mecanismo de visualização EJS
expressApp.set('view engine', 'ejs'); 
expressApp.set('views', path.join(__dirname, 'views'));

//caminhos das rotas
const routerloginusuarios = require('./routes/Login');
const routercadastrolivros = require('./routes/CadastroLivro');
const routersaidalivros = require('./routes/SaidasLivros');
const routerBiblioteca = require('./routes/BiblioControle')
const routeradicionaradm = require('./routes/AdicionarADM');
const routerexcluiradm = require('./routes/ExcluirADM');
const routerbloqueiausarios = require('./routes/BloqueioUsuarios');
const roueterlistalivros = require('./routes/MyBiblioteca');
const routertablesadmconnect = require('./routes/TabelaAdmConnect')
const routerentradalivros = require('./routes/EntradaLivro')
const routercadastrousuarios = require('./routes/Cadastrousuario');

//rota de login de usuarios
expressApp.use('/', routerloginusuarios);
//rota de cadastro de usuarios
expressApp.use('/cadastrousuarios', routercadastrousuarios, );
//rota de cadastro de livros
expressApp.use('/cadastrolivro',routercadastrolivros);
//rota de saidas de livros
expressApp.use('/registrosaidalivro', routersaidalivros);
//rota entrada de livros
expressApp.use('/entradalivro', routerentradalivros);
//rota para os grafico de total de usuario, total de livros, total de agendamentos e total de saidas de livro
expressApp.use('/BiblioControle', routerBiblioteca);
//rota para adicionar adms
expressApp.use('/adicionaradministrado', routeradicionaradm);
//rotas para excluir adms
expressApp.use('/excluiradministrado', routerexcluiradm);
//rota para graficos MyBiblioteca
expressApp.use('/MyBiblioteca', roueterlistalivros);
//rota para excluir usuarios
expressApp.use('/Bloqueiausuario', routerbloqueiausarios);
//tabela AdmConnect
expressApp.use('/AdmConnect', routertablesadmconnect);
//carteira usuarios

expressApp.listen(expressPort, () => {
    console.log(`Servidor rodando em http://localhost:${expressPort}`);
});