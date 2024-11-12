/*const { app, BrowserWindow } = require('electron');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Sequelize = require('sequelize');
const ejs = require('ejs');

const expressPort = 5000;

// Configuração do Express
const expressApp = express();
expressApp.use(express.urlencoded({ extended: true }));
expressApp.use(bodyParser.urlencoded({ extended: true }));
expressApp.use('/public', express.static(path.join(__dirname, 'public')));
expressApp.set('view engine', 'ejs');
expressApp.set('views', path.join(__dirname, 'views'));

// Configuração do Sequelize
// (assumindo que você já configurou a conexão com o banco de dados)

// Caminhos das rotas
const routerloginusuarios = require('./routes/Login');
const routercadastrousuarios = require('./routes/CadastroUsuario');
const routercadastrolivros = require('./routes/CadastroLivro');
const routersaidalivros = require('./routes/SaidasLivros');
const routerBiblioteca = require('./routes/BiblioControle');
const routeradicionaradm = require('./routes/AdicionarADM');
const routerexcluiradm = require('./routes/ExcluirADM');
const routerbloqueiausarios = require('./routes/BloqueioUsuarios');
const roueterlistalivros = require('./routes/MyBiblioteca');
const routertablesAdmconnect = require('./routes/TabelaAdmConnect')

// Roteamento
expressApp.use('/', routerloginusuarios);
expressApp.use('/cadastrousuarios', routercadastrousuarios);
expressApp.use('/cadastrolivro', routercadastrolivros);
expressApp.use('/registrosaidalivro', routersaidalivros);
expressApp.use('/BiblioControle', routerBiblioteca);
expressApp.use('/adicionaradministrado', routeradicionaradm);
expressApp.use('/excluiradministrado', routerexcluiradm);
expressApp.use('/Bloqueiausuario', routerbloqueiausarios);
expressApp.use('/MyBiblioteca', roueterlistalivros);
expressApp.use('/AdmConnect', routertablesAdmconnect);

// Iniciar o servidor Express
const expressServer = expressApp.listen(expressPort, () => {
    console.log(`Servidor rodando em http://localhost:${expressPort}`);
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 3000,
        height: 3000,
        frame: true,
        autoHideMenuBar: true,
        resizable: false,
        icon: path.join(__dirname, 'public', 'IMG', 'logobiblioeduca.png'),
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Carregar a página web do Express no Electron
    mainWindow.loadURL(`http://localhost:${expressPort}`);
}

// Quando o Electron estiver pronto, criar a janela
app.whenReady().then(createWindow);

*/
