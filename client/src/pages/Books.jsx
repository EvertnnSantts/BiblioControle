import { useState, useEffect } from 'react';
import { bookService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const GENRES = [
  { value: 'ACAO', label: 'Ação' },
  { value: 'FICCAO-CIENTIFICA', label: 'Ficção Científica' },
  { value: 'ROMANCE', label: 'Romance' },
  { value: 'FANTASIA', label: 'Fantasia' },
  { value: 'MISTERIO', label: 'Mistério' },
  { value: 'HORROR', label: 'Horror' },
  { value: 'AVENTURA', label: 'Aventura' },
  { value: 'HISTORICO', label: 'Histórico' },
  { value: 'BIOGRAFIA', label: 'Biografia' },
  { value: 'DIDATICOS', label: 'Didáticos' },
  { value: 'TECNOLOGIA', label: 'Tecnologia' },
  { value: 'OUTROS', label: 'Outros' }
];

const SITUACOES = [
  { value: 'disponivel', label: 'Disponível' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'reservado', label: 'Reservado' }
];

const Books = () => {
  const { success, error } = useToast();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genero, setGenero] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    quantidade: 1,
    estante: '',
    observacao: '',
    genero: 'OUTROS',
    situacao: 'disponivel'
  });

  const fetchBooks = async () => {
    try {
      const params = { search, genero: genero || undefined };
      const response = await bookService.getAll(params);
      setBooks(response.data.data.books);
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [search, genero]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await bookService.update(editingBook.id, formData);
        success('Livro atualizado com sucesso!');
      } else {
        await bookService.create(formData);
        success('Livro cadastrado com sucesso!');
      }
      setModalOpen(false);
      resetForm();
      fetchBooks();
    } catch (err) {
      console.error('Erro ao salvar livro:', err);
      error(err.response?.data?.message || 'Erro ao salvar livro');
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setFormData({
      titulo: book.titulo,
      autor: book.autor,
      quantidade: book.quantidade,
      estante: book.estante || '',
      observacao: book.observacao || '',
      genero: book.genero,
      situacao: book.situacao
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este livro?')) {
      try {
        await bookService.delete(id);
        success('Livro excluído com sucesso!');
        fetchBooks();
      } catch (err) {
        console.error('Erro ao excluir livro:', err);
        error(err.response?.data?.message || 'Erro ao excluir livro');
      }
    }
  };

  const resetForm = () => {
    setEditingBook(null);
    setFormData({
      titulo: '',
      autor: '',
      quantidade: 1,
      estante: '',
      observacao: '',
      genero: 'OUTROS',
      situacao: 'disponivel'
    });
  };

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px' },
    { header: 'Título', accessor: 'titulo' },
    { header: 'Autor', accessor: 'autor' },
    { header: 'Total', accessor: 'quantidade', width: '70px' },
    { header: 'Disp.', accessor: 'quantidadeDisponivel', width: '70px', render: (row) => (
      <span className={`font-medium ${row.quantidadeDisponivel > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {row.quantidadeDisponivel ?? row.quantidade}
      </span>
    )},
    { header: 'Gênero', accessor: 'genero' },
    { header: 'Situação', accessor: 'situacao', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.situacao === 'disponivel' ? 'bg-green-100 text-green-800' :
        row.situacao === 'reservado' ? 'bg-orange-100 text-orange-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {row.situacao}
      </span>
    )},
    { header: 'Ações', width: '100px', render: (row) => (
      <div className="flex gap-2">
        <button onClick={() => handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Livros</h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Livro
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por título ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            options={[{ value: '', label: 'Todos os gêneros' }, ...GENRES]}
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingBook ? 'Editar Livro' : 'Novo Livro'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Título"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              required
            />
            <Input
              label="Autor"
              value={formData.autor}
              onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Quantidade"
              type="number"
              min="0"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Estante"
              value={formData.estante}
              onChange={(e) => setFormData({ ...formData, estante: e.target.value })}
            />
            <Select
              label="Gênero"
              options={GENRES}
              value={formData.genero}
              onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            />
          </div>
          <Select
            label="Situação"
            options={SITUACOES}
            value={formData.situacao}
            onChange={(e) => setFormData({ ...formData, situacao: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingBook ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Books;