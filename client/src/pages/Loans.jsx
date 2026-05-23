import { useState, useEffect } from 'react';
import { loanService, bookService, userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Plus, RotateCcw, Search, User, BookOpen, Check, Ban } from 'lucide-react';

const Loans = () => {
  const { success, error } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [formData, setFormData] = useState({
    bookId: '',
    userId: '',
    dataPrevista: '',
    turma: ''
  });

  const fetchLoans = async () => {
    try {
      const params = { status: status || undefined };
      const response = await loanService.getAll(params);
      setLoans(response.data.data.loans);
    } catch (err) {
      console.error('Erro ao buscar empréstimos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const booksRes = await bookService.getAll({ limit: 100 });
      // Mostrar todos os livros com quantidade disponível > 0
      const availableBooks = booksRes.data.data.books.filter(b => {
        const disponivel = b.quantidadeDisponivel || (b.quantidade - (b.emprestimosAtivos || 0));
        return disponivel > 0;
      });
      setBooks(availableBooks);
    } catch (err) {
      console.error('Erro ao buscar livros:', err);
    }
  };

  // Buscar usuários por nome, ID, email ou telefone
  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }
    
    setSearchingUsers(true);
    try {
      const response = await userService.search(query);
      setUserResults(response.data.data.users);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Selecionar usuário da lista
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setUserSearch(`${user.nome} (${user.matricula})`);
    setUserResults([]);
  };

  useEffect(() => {
    fetchLoans();
  }, [status]);

  useEffect(() => {
    if (modalOpen) {
      fetchBooks();
      setSelectedUser(null);
      setUserSearch('');
      setUserResults([]);
    }
  }, [modalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loanService.create(formData);
      success('Empréstimo realizado com sucesso!');
      setModalOpen(false);
      resetForm();
      fetchLoans();
    } catch (err) {
      console.error('Erro ao criar empréstimo:', err);
      error(err.response?.data?.message || 'Erro ao criar empréstimo');
    }
  };

  const handleReturn = async (id) => {
    if (window.confirm('Confirmar devolução do livro?')) {
      try {
        await loanService.return(id, {});
        success('Livro devolvido com sucesso! Usuário desbloqueado automaticamente.');
        fetchLoans();
      } catch (err) {
        console.error('Erro ao devolver livro:', err);
        error(err.response?.data?.message || 'Erro ao devolver livro');
      }
    }
  };

  // Bloquear usuário (mantém empréstimo ativo)
  const handleBlockUser = async (userId, loanId) => {
    const motivo = window.prompt('Digite o motivo do bloqueio:');
    if (!motivo) return;
    
    try {
      await userService.block(userId, { motivo });
      success('Usuário bloqueado com sucesso!');
      fetchLoans();
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err);
      error(err.response?.data?.message || 'Erro ao bloquear usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      bookId: '',
      userId: '',
      dataPrevista: '',
      turma: ''
    });
    setSelectedUser(null);
    setUserSearch('');
  };

  const statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'devolvido', label: 'Devolvidos' },
    { value: 'atrasado', label: 'Atrasados' }
  ];

  // Calcular livros disponíveis para display
  const getAvailableQuantity = (book) => {
    return book.quantidadeDisponivel || book.quantidade;
  };

  const bookOptions = books.map(b => ({ 
    value: b.id, 
    label: `${b.titulo} - ${b.autor} (${getAvailableQuantity(b)} disponíveis)` 
  }));

  const columns = [
    { header: 'Livro', accessor: 'book.titulo' },
    { header: 'Usuário', render: (row) => (
      <div className="flex items-center gap-2">
        <span>{row.user?.nome}</span>
        {row.user?.ativo === false && (
          <span className="text-red-500" title="Usuário bloqueado">
            <Ban className="w-4 h-4" />
          </span>
        )}
      </div>
    )},
    { header: 'Turma', accessor: 'turma' },
    { header: 'Data Emp.', accessor: 'dataEmprestimo' },
    { header: 'Data Prev.', accessor: 'dataPrevista' },
    { header: 'Status', render: (row) => {
      const isAtrasado = row.isAtrasado || (row.status === 'ativo' && new Date(row.dataPrevista) < new Date());
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'devolvido' ? 'bg-green-100 text-green-800' :
          isAtrasado ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {isAtrasado ? 'Atrasado' : row.status}
        </span>
      );
    }},
    { header: 'Devolvido', width: '80px', render: (row) => (
      row.status === 'devolvido' || row.status === 'atrasado' ? (
        <span className="text-green-600 flex items-center gap-1">
          <Check className="w-5 h-5" />
        </span>
      ) : (
        <span className="text-gray-300">-</span>
      )
    )},
    { header: 'Ações', width: '120px', render: (row) => (
      <div className="flex items-center gap-2">
        {row.status === 'ativo' && (
          <>
            <button 
              onClick={() => handleReturn(row.id)} 
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Devolver"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {row.user?.ativo !== false && (
              <button 
                onClick={() => handleBlockUser(row.userId, row.id)} 
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Bloquear usuário"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    )}
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empréstimos</h1>
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Empréstimo
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Select
          options={statusOptions}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-48"
        />
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Table columns={columns} data={loans} emptyMessage="Nenhum empréstimo encontrado" />
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Empréstimo"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo de busca de usuário */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
            <div className="relative">
              <Input
                placeholder="Buscar por nome, ID, email ou telefone..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSelectedUser(null);
                  setFormData({ ...formData, userId: '' });
                  searchUsers(e.target.value);
                }}
                icon={Search}
              />
            </div>
            {/* Resultados da busca */}
            {userResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {userResults.map(user => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{user.nome}</div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id} | Matrícula: {user.matricula} | {user.email}
                        {user.turma && ` | Turma: ${user.turma}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchingUsers && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                Buscando...
              </div>
            )}
          </div>

          {/* Campo de livro com quantidade disponível */}
          <div>
            <Select
              label="Livro"
              options={bookOptions}
              value={formData.bookId}
              onChange={(e) => setFormData({ ...formData, bookId: parseInt(e.target.value) })}
              placeholder="Selecione um livro"
              required
            />
            {formData.bookId && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {books.find(b => b.id === formData.bookId) && 
                    `${getAvailableQuantity(books.find(b => b.id === formData.bookId))} exemplar(es) disponível(is)`
                  }
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Devolução Prevista"
              type="date"
              value={formData.dataPrevista}
              onChange={(e) => setFormData({ ...formData, dataPrevista: e.target.value })}
              required
            />
            {/* Turma - obrigatória, o aluno informa no momento do empréstimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
              <Input
                placeholder="Informe a turma do aluno"
                value={formData.turma}
                onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.userId || !formData.bookId}>
              Criar Empréstimo
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Loans;