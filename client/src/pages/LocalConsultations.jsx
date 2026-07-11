import { useState, useEffect } from 'react';
import { localConsultationService, bookService, userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import Input from '../components/ui/Input';
import { Plus, RotateCcw, Search, User, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const LocalConsultations = () => {
  const { success, error } = useToast();
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [now, setNow] = useState(new Date());
  const [formData, setFormData] = useState({
    bookId: '',
    userId: '',
    duracaoTempo: '04:00',
    turma: ''
  });
  const [confirmReturn, setConfirmReturn] = useState({ isOpen: false, id: null });

  // Atualiza o relógio a cada segundo para o contador regressivo
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchConsultas = async () => {
    try {
      const params = { status: status || undefined };
      const response = await localConsultationService.getAll(params);
      setConsultas(response.data.data.consultas);
    } catch (err) {
      console.error('Erro ao buscar consultas locais:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const booksRes = await bookService.getAll({ limit: 100 });
      // Apenas livros com situação "consulta" e que não estão em consulta ativa
      const availableBooks = booksRes.data.data.books.filter(b => b.consultaLocal && !b.consultaAtiva);
      setBooks(availableBooks);
    } catch (err) {
      console.error('Erro ao buscar livros:', err);
    }
  };

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

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setUserSearch(`${user.nome} (${user.matricula})`);
    setUserResults([]);
  };

  const handleBarcodeScan = async (code) => {
    try {
      if (code.startsWith('USR-')) {
        const res = await userService.getByBarcode(code);
        if (res.data.success && res.data.data.user) {
          const user = res.data.data.user;
          handleSelectUser(user);
          success(`Aluno ${user.nome} selecionado!`);
        }
      } else if (code.startsWith('LIV-')) {
        const res = await bookService.getByBarcode(code);
        if (res.data.success && res.data.data.book) {
          const book = res.data.data.book;
          if (book.situacao !== 'consulta') {
            error('Este livro é para empréstimo convencional. Use a aba de Empréstimos.');
            return;
          }
          handleSelectBook(book);
          success(`Livro "${book.titulo}" selecionado!`);
        }
      } else {
        const res = await bookService.getAll({ search: code });
        if (res.data.success && res.data.data.books.length > 0) {
          const book = res.data.data.books[0];
          if (book.situacao !== 'consulta') {
            error('Este livro é para empréstimo convencional. Use a aba de Empréstimos.');
            return;
          }
          handleSelectBook(book);
          success(`Livro "${book.titulo}" selecionado!`);
        } else {
          const userRes = await userService.getAll({ search: code });
          if (userRes.data.success && userRes.data.data.users.length > 0) {
            const user = userRes.data.data.users[0];
            handleSelectUser(user);
            success(`Aluno ${user.nome} selecionado!`);
          } else {
            error('Código não reconhecido no sistema.');
          }
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Erro ao processar leitura do código.');
    }
  };

  useBarcodeScanner(handleBarcodeScan);

  useEffect(() => {
    fetchConsultas();
  }, [status]);

  useEffect(() => {
    if (modalOpen) {
      fetchBooks();
      setSelectedUser(null);
      setUserSearch('');
      setUserResults([]);
      setSelectedBook(null);
      setBookSearch('');
      setBookResults([]);
    }
  }, [modalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await localConsultationService.create(formData);
      success('Consulta local iniciada com sucesso!');
      setModalOpen(false);
      resetForm();
      fetchConsultas();
    } catch (err) {
      console.error('Erro ao iniciar consulta local:', err);
      error(err.response?.data?.message || 'Erro ao iniciar consulta local');
    }
  };

  const handleReturn = async (id) => {
    try {
      await localConsultationService.return(id, {});
      success('Consulta encerrada com sucesso!');
      fetchConsultas();
    } catch (err) {
      console.error('Erro ao encerrar consulta:', err);
      error(err.response?.data?.message || 'Erro ao encerrar consulta');
    }
  };

  const resetForm = () => {
    setFormData({
      bookId: '',
      userId: '',
      duracaoTempo: '04:00',
      turma: ''
    });
    setSelectedUser(null);
    setUserSearch('');
    setSelectedBook(null);
    setBookSearch('');
    setBookResults([]);
  };

  const formatTimeRemaining = (expirationDate) => {
    const exp = new Date(expirationDate);
    const diff = exp - now;
    
    if (diff <= 0) return 'Vencida';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const statusOptions = [
    { value: '', label: 'Todas' },
    { value: 'em_consulta', label: 'Em Consulta' },
    { value: 'devolvida', label: 'Devolvidas' },
    { value: 'vencida', label: 'Vencidas' }
  ];

  const bookOptions = books.map(b => ({ 
    value: b.id, 
    label: `${b.titulo} - ${b.autor}` 
  }));

  const columns = [
    { header: 'Livro', accessor: 'book.titulo' },
    { header: 'Usuário', accessor: 'user.nome' },
    { header: 'Turma', accessor: 'turma' },
    { header: 'Retirada', render: (row) => new Date(row.dataRetirada).toLocaleString() },
    { header: 'Tempo Restante', render: (row) => {
      if (row.status === 'devolvida') return '-';
      const isVencida = row.status === 'vencida' || new Date(row.dataExpiracao) <= now;
      return (
        <span className={`font-mono font-medium ${isVencida ? 'text-red-600' : 'text-blue-600'}`}>
          {formatTimeRemaining(row.dataExpiracao)}
        </span>
      );
    }},
    { header: 'Status', render: (row) => {
      const isVencida = row.status === 'vencida' || new Date(row.dataExpiracao) <= now;
      const displayStatus = row.status === 'em_consulta' && isVencida ? 'vencida' : row.status;
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          displayStatus === 'devolvida' ? 'bg-green-100 text-green-800' :
          displayStatus === 'vencida' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {displayStatus === 'em_consulta' ? 'Em Consulta' :
           displayStatus === 'devolvida' ? 'Devolvida' : 'Vencida'}
        </span>
      );
    }},
    { header: 'Ações', width: '120px', render: (row) => (
      <div className="flex items-center gap-2">
        {(row.status === 'em_consulta' || row.status === 'vencida') && (
          <button 
            onClick={() => setConfirmReturn({ isOpen: true, id: row.id })} 
            className="p-1 text-green-600 hover:bg-green-50 rounded flex items-center gap-1"
            title="Devolver"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Devolver</span>
          </button>
        )}
      </div>
    )}
  ];

  const searchBooks = async (query) => {
    if (!query || query.length < 2) {
      setBookResults([]);
      return;
    }
    setSearchingBooks(true);
    try {
      const response = await bookService.getAll({ search: query, limit: 10 });
      const filtered = (response.data.data.books || []).filter(b => b.consultaLocal && !b.consultaAtiva);
      setBookResults(filtered);
    } catch (err) {
      console.error('Erro ao buscar livros:', err);
    } finally {
      setSearchingBooks(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setBookSearch(`${book.titulo} (${book.autor})`);
    setBookResults([]);
    setFormData(prev => ({ ...prev, bookId: book.id }));
  };

  const handleBookSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (bookResults.length === 1) {
        handleSelectBook(bookResults[0]);
      } else if (bookSearch.trim()) {
        const code = bookSearch.trim();
        if (code.startsWith('LIV-') || code.length > 5) {
          bookService.getByBarcode(code)
            .then(res => {
              if (res.data.success && res.data.data.book) {
                handleSelectBook(res.data.data.book);
                success(`Livro "${res.data.data.book.titulo}" selecionado!`);
              }
            })
            .catch(() => {});
        }
      }
    }
  };

  const handleUserSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (userResults.length === 1) {
        handleSelectUser(userResults[0]);
      } else if (userSearch.trim()) {
        const code = userSearch.trim();
        if (code.startsWith('USR-') || code.length > 5) {
          userService.getByBarcode(code)
            .then(res => {
              if (res.data.success && res.data.data.user) {
                handleSelectUser(res.data.data.user);
                success(`Aluno ${res.data.data.user.nome} selecionado!`);
              }
            })
            .catch(() => {});
        }
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Consultas Locais</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Consulta
        </Button>
      </div>

      <form className="search-bar" onSubmit={(e) => e.preventDefault()}>
        <Input
          placeholder="Buscar por nome, matrícula ou livro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={Search}
        />
      </form>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Table columns={columns} data={consultas} emptyMessage="Nenhuma consulta local encontrada" />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova Consulta Local"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
                onKeyDown={handleUserSearchKeyDown}
                icon={Search}
              />
            </div>
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
                        ID: {user.id} | Matrícula: {user.matricula}
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

          {/* Campo de busca de livro */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Livro (apenas livros de consulta)</label>
            <div className="relative">
              <Input
                placeholder="Buscar por título, autor ou código de barras..."
                value={bookSearch}
                onChange={(e) => {
                  setBookSearch(e.target.value);
                  setSelectedBook(null);
                  setFormData({ ...formData, bookId: '' });
                  searchBooks(e.target.value);
                }}
                onKeyDown={handleBookSearchKeyDown}
                icon={BookOpen}
              />
            </div>
            {/* Resultados da busca de livros */}
            {bookResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                {bookResults.map(book => {
                  const isAvailable = !book.consultaAtiva;
                  return (
                    <button
                      key={book.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => handleSelectBook(book)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="bg-green-100 p-2 rounded-full">
                        <BookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 truncate">{book.titulo}</div>
                        <div className="text-sm text-gray-500 truncate">
                          {book.autor} · {book.genero}
                          {book.estante && ` · Estante: ${book.estante}`}
                        </div>
                      </div>
                      <div className="text-xs font-semibold">
                        {isAvailable ? (
                          <span className="text-green-600">Disponível</span>
                        ) : (
                          <span className="text-red-600">Em Consulta</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {searchingBooks && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                Buscando...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Duração (HH:MM)"
              type="time"
              value={formData.duracaoTempo}
              onChange={(e) => setFormData({ ...formData, duracaoTempo: e.target.value })}
              required
            />
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
              Iniciar Consulta
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmReturn.isOpen}
        onClose={() => setConfirmReturn({ isOpen: false, id: null })}
        onConfirm={() => handleReturn(confirmReturn.id)}
        title="Encerrar Consulta"
        message="Tem certeza que deseja confirmar a devolução deste livro e encerrar a consulta?"
        confirmText="Devolver"
        variant="primary"
      />
    </div>
  );
};

export default LocalConsultations;
