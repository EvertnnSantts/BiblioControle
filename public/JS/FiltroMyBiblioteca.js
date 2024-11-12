const selectClasificacao = document.getElementById('clasificacao');
const tabelaLivros = document.getElementById('livros').getElementsByTagName('tbody')[0];
const selectAutor = document.getElementById('autor');
const tabelaAutor = document.getElementById('autor').getElementsByTagName('tbody')[0];

selectClasificacao.addEventListener('change', applyFilters);
selectAutor.addEventListener('change', applyFilters);

function applyFilters() {
    const selectedClasificacao = selectClasificacao.value;
    const selectedAutor = selectAutor.value;

    Array.from(tabelaLivros.getElementsByTagName('tr')).forEach(row => {
        const livroClasificacao = row.getElementsByTagName('td')[5].innerText;
        const livroAutor = row.getElementsByTagName('td')[2].innerText;

        if ((selectedClasificacao === 'todos' || livroClasificacao === selectedClasificacao) &&
            (selectedAutor === 'todos' || livroAutor === selectedAutor)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

