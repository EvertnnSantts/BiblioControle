 //input titulocad:
 document.getElementById('titulocad').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labeltitulocad');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input autorcad:
document.getElementById('autorcad').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelautorcad');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input fileiracad:
document.getElementById('fileiracad').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelfileiracad');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});
  
//input estantecad:
document.getElementById('estantecad').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelestantecad');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input observacaocad:
document.getElementById('observacaocad').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelobservacaocad');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

  
//input titulo:
document.getElementById('titulo').addEventListener('input', function() {
  var inputValue = this.value;
  var labeltitulo = document.getElementById('labeltitulo');
 labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input autor:
document.getElementById('autor').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelautor');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input fileira:
document.getElementById('fileira').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelfileira');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input estante
document.getElementById('estante').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelestante');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input observacao:
document.getElementById('observacao').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelobservacao');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input titulo saida:
document.getElementById('titulosaida').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labeltitulosaida');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

//input id saida:
document.getElementById('id').addEventListener('input', function() {
    var inputValue = this.value;
    var labeltitulo = document.getElementById('labelid');
   labeltitulo.style.opacity = inputValue.trim() !== '' ? '0' : '1';
});

      // Função para fazer uma requisição ao servidor e exibir a mensagem com o nome do livro
      async function exibirMensagem() {
         try {
             // Fazendo uma requisição GET para o servidor
             const response = await fetch('/enviar-mensagem');
             const data = await response.json();
             
             // Exibindo a mensagem na tag <p>
             document.getElementById('mensagem').innerText = data.mensagem;
         } catch (error) {
             console.error('Erro ao enviar requisição:', error);
         }
     }

     // Chamando a função ao carregar a página
     exibirMensagem();
