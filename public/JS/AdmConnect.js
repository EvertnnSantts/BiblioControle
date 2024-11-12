document.getElementById('turma').addEventListener('change', function() {
    const valorSelecionado = this.value;
    const linhasTabela = document.querySelectorAll('#livros tbody tr');

    linhasTabela.forEach(function(linha) {
        const turma = linha.lastElementChild.textContent;

        if (valorSelecionado === 'todos' || turma === valorSelecionado) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
});

