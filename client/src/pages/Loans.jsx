import { useState, useEffect } from 'react';
import { loanService, bookService, userService } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import PromptModal from '../components/ui/PromptModal';
import Input from '../components/ui/Input';
import { Plus, RotateCcw, Search, User, BookOpen, Check, Ban } from 'lucide-react';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';

const Loans = () => {
  const { success, error } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userHasActiveLoan, setUserHasActiveLoan] = useState(false);
  const [userHasActiveConsultation, setUserHasActiveConsultation] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookSearch, setBookSearch] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [searchingBooks, setSearchingBooks] = useState(false);
  const [formData, setFormData] = useState({
    bookId: '',
    userId: '',
    dataPrevista: '',
    turma: ''
  });
  const [confirmReturn, setConfirmReturn] = useState({ isOpen: false, id: null });
  const [promptBlock, setPromptBlock] = useState({ isOpen: false, userId: null, loanId: null });


  const fetchLoans = async () => {
    try {
      const params = {
        status: status || undefined,
        search: search || undefined
      };
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
      // Incluir livros de consulta local na lista (para mostrá-los com aviso)
      // Apenas excluir livros sem exemplares e totalmente reservados
      const availableBooks = booksRes.data.data.books.filter(b => {
        if (b.consultaLocal) return false; // Consulta local nunca aparece para empréstimo
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
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, userId: user.id });
    setUserSearch(`${user.nome} (${user.matricula})`);
    setUserResults([]);
    // Verificar se o usuário já tem empréstimo ativo
    try {
      const loansRes = await loanService.getAll({ userId: user.id, status: 'ativo' });
      setUserHasActiveLoan(loansRes.data.data.loans.length > 0);
    } catch {
      setUserHasActiveLoan(false);
    }
    
    // Verificar se o usuário tem consulta local ativa ou vencida
    try {
      const { localConsultationService } = await import('../services/api');
      // Busca em_consulta
      const consultaResAtiva = await localConsultationService.getAll({ userId: user.id, status: 'em_consulta' });
      // Busca vencida
      const consultaResVencida = await localConsultationService.getAll({ userId: user.id, status: 'vencida' });
      
      setUserHasActiveConsultation(consultaResAtiva.data.data.consultas.length > 0 || consultaResVencida.data.data.consultas.length > 0);
    } catch {
      setUserHasActiveConsultation(false);
    }
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
          if (book.situacao === 'consulta') {
            error('Este livro é exclusivo para consulta local. Use a aba de Consultas.');
            return;
          }
          handleSelectBook(book);
          success(`Livro "${book.titulo}" selecionado!`);
        }
      } else {
        // Tentar buscar por texto/código geral
        const res = await bookService.getAll({ search: code });
        if (res.data.success && res.data.data.books.length > 0) {
          const book = res.data.data.books[0];
          if (book.situacao === 'consulta') {
            error('Este livro é exclusivo para consulta local. Use a aba de Consultas.');
            return;
          }
          handleSelectBook(book);
          success(`Livro "${book.titulo}" selecionado!`);
        } else {
          // Tentar buscar usuário por matrícula
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
    fetchLoans();
  }, [status, search]);

  useEffect(() => {
    if (modalOpen) {
      fetchBooks();
      setSelectedUser(null);
      setUserSearch('');
      setUserResults([]);
      setUserHasActiveLoan(false);
      setUserHasActiveConsultation(false);
      setSelectedBook(null);
      setBookSearch('');
      setBookResults([]);
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
    try {
      await loanService.return(id, {});
      success('Livro devolvido com sucesso! Usuário desbloqueado automaticamente.');
      fetchLoans();
    } catch (err) {
      console.error('Erro ao devolver livro:', err);
      error(err.response?.data?.message || 'Erro ao devolver livro');
    }
  };

  // Bloquear usuário (mantém empréstimo ativo)
  const handleBlockUser = async (userId, motivo) => {
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
    setUserHasActiveLoan(false);
    setUserHasActiveConsultation(false);
    setSelectedBook(null);
    setBookSearch('');
    setBookResults([]);
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
              onClick={() => setConfirmReturn({ isOpen: true, id: row.id })} 
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Devolver"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            {row.user?.ativo !== false && (
              <button 
                onClick={() => setPromptBlock({ isOpen: true, userId: row.userId, loanId: row.id })} 
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

  const searchBooks = async (query) => {
    if (!query || query.length < 2) {
      setBookResults([]);
      return;
    }
    setSearchingBooks(true);
    try {
      const response = await bookService.getAll({ search: query, limit: 10 });
      const filtered = (response.data.data.books || []).filter(b => !b.consultaLocal);
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
      const availableBooks = bookResults.filter(b => getAvailableQuantity(b) > 0);
      if (availableBooks.length === 1) {
        handleSelectBook(availableBooks[0]);
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
        <h1 className="text-2xl font-bold text-gray-800">Empréstimos</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Empréstimo
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar empréstimos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
                  setUserHasActiveLoan(false);
                  setUserHasActiveConsultation(false);
                  searchUsers(e.target.value);
                }}
                onKeyDown={handleUserSearchKeyDown}
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

          {/* Aviso: usuário já possui empréstimo ativo */}
          {selectedUser && userHasActiveLoan && (
            <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <Ban className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Usuário já possui um empréstimo ativo
                </p>
                <p className="text-xs text-orange-700 mt-0.5">
                  Cada usuário pode ter no máximo 1 livro emprestado por vez. Devolva o livro atual antes de realizar um novo empréstimo.
                </p>
              </div>
            </div>
          )}

          {/* Aviso: usuário já possui consulta local ativa ou vencida */}
          {selectedUser && userHasActiveConsultation && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Ban className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">
                  Usuário bloqueado por Consulta Local
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  O usuário possui uma consulta local ativa ou vencida. É necessário devolver o livro da consulta antes de realizar novos empréstimos.
                </p>
              </div>
            </div>
          )}

          {/* Campo de busca de livro */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Livro</label>
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
                  const availableQuantity = getAvailableQuantity(book);
                  const isAvailable = availableQuantity > 0 || book.consultaLocal;
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
                        {book.consultaLocal ? (
                          <span className="text-orange-600">Consulta Local</span>
                        ) : isAvailable ? (
                          <span className="text-green-600">Disp: {availableQuantity}</span>
                        ) : (
                          <span className="text-red-600">Indisponível</span>
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
            {selectedBook && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  {getAvailableQuantity(selectedBook)} exemplar(es) disponível(is)
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
            <Button 
              type="submit" 
              disabled={!formData.userId || !formData.bookId || userHasActiveLoan || userHasActiveConsultation}
              title={userHasActiveLoan ? 'Usuário já possui empréstimo ativo' : userHasActiveConsultation ? 'Usuário já possui consulta local ativa' : ''}
            >
              Criar Empréstimo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={confirmReturn.isOpen}
        onClose={() => setConfirmReturn({ isOpen: false, id: null })}
        onConfirm={() => handleReturn(confirmReturn.id)}
        title="Confirmar Devolução"
        message="Tem certeza que deseja confirmar a devolução deste livro?"
        confirmText="Devolver"
        variant="primary"
      />

      <PromptModal
        isOpen={promptBlock.isOpen}
        onClose={() => setPromptBlock({ isOpen: false, userId: null, loanId: null })}
        onConfirm={(motivo) => handleBlockUser(promptBlock.userId, motivo)}
        title="Bloquear Usuário"
        message="Qual o motivo do bloqueio?"
        placeholder="Descreva o motivo"
        confirmText="Bloquear"
      />
    </div>
  );
};

export default Loans;
