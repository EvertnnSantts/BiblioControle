import { useState, useEffect } from 'react';
import { bookService } from '../services/api';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Table from '../components/ui/Table';
import { Search, BookOpen, Filter } from 'lucide-react';

const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, disponiveis: 0, emprestados: 0, consulta: 0 });
  const [search, setSearch] = useState('');
  const [genero, setGenero] = useState('');
  const [autor, setAutor] = useState('');
  const [generos, setGeneros] = useState([]);
  const [autores, setAutores] = useState([]);

  const fetchBooks = async () => {
    try {
      const params = { 
        search, 
        genero: genero || undefined,
        autor: autor || undefined
      };
      const response = await bookService.getAll(params);
      setBooks(response.data.data.books);
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const [generosRes, autoresRes, statsRes] = await Promise.all([
        bookService.getGeneros(),
        bookService.getAutores(),
        bookService.getStats()
      ]);
      setGeneros(generosRes.data.data.generos);
      setAutores(autoresRes.data.data.autores);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Erro ao buscar filtros:', error);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, genero, autor]);

  const columns = [
    { header: 'Tombo', accessor: 'id', width: '80px', render: (row) => String(row.id).padStart(6, '0') },
    { header: 'Título', accessor: 'titulo' },
    { header: 'Autor', accessor: 'autor' },
    { header: 'Qtd', accessor: 'quantidade', width: '60px' },
    { header: 'Estante', accessor: 'estante', width: '100px' },
    { header: 'Gênero', accessor: 'genero' },
    { header: 'Situação', accessor: 'situacao', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.situacao === 'disponivel' ? 'bg-green-100 text-green-800' :
        row.situacao === 'emprestimo' ? 'bg-orange-100 text-orange-800' :
        row.situacao === 'consulta' ? 'bg-blue-100 text-blue-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {row.situacao}
      </span>
    )}
  ];

  const generoOptions = [{ value: 'todos', label: 'Todos os gêneros' }, ...generos.map(g => ({ value: g, label: g }))];
  const autorOptions = [{ value: 'todos', label: 'Todos os autores' }, ...autores.map(a => ({ value: a, label: a }))];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Busca Literária</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Disponíveis</p>
          <p className="text-2xl font-bold text-green-600">{stats.disponiveis}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Emprestados</p>
          <p className="text-2xl font-bold text-orange-600">{stats.emprestados}</p>
        </Card>
        <Card className="text-center">
          <p className="text-sm text-gray-500">Consulta</p>
          <p className="text-2xl font-bold text-blue-600">{stats.consulta}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por título ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            options={generoOptions}
            value={genero}
            onChange={(e) => setGenero(e.target.value === 'todos' ? '' : e.target.value)}
            className="w-48"
          />
          <Select
            options={autorOptions}
            value={autor}
            onChange={(e) => setAutor(e.target.value === 'todos' ? '' : e.target.value)}
            className="w-48"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table columns={columns} data={books} emptyMessage="Nenhum livro encontrado" />
        )}
      </Card>
    </div>
  );
};

export default Library;