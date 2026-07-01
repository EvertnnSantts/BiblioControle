import { useState, useEffect } from 'react';
import { studentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Table from '../components/ui/Table';
import { BookOpen, Clock, AlertCircle, LogOut, Search, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAutoLogout } from '../hooks/useAutoLogout';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useAutoLogout();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchDashboard();
    fetchBooks();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = async () => {
    try {
      setFetchError(false);
      const res = await studentService.getDashboard();
      setDashboardData(res.data.data);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const res = await studentService.getAvailableBooks({ search });
      setBooks(res.data.data.books);
    } catch (error) {
      console.error('Erro ao buscar catálogo:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBooks();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleLogout = () => {
    logout();
    navigate('/aluno/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (fetchError || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Erro ao carregar seus dados</h2>
          <p className="text-gray-500 mb-6">Não foi possível conectar ao servidor. Verifique sua conexão.</p>
          <button
            onClick={fetchDashboard}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={handleLogout}
            className="ml-4 px-6 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  const { activeLoans, activeConsultations, loanHistory } = dashboardData;

  const formatTimeRemaining = (expirationDate) => {
    const exp = new Date(expirationDate);
    const diff = exp - now;
    
    if (diff <= 0) return 'Vencida';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const hasPendingIssues = activeLoans.some(l => l.status === 'atrasado') || 
                           activeConsultations.some(c => c.status === 'vencida') || 
                           user.ativo === false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6" />
              <h1 className="text-xl font-bold">Portal do Aluno</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium hidden sm:block">Olá, {user.nome}</span>
              <button
                onClick={() => navigate('/aluno/carteira')}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-teal-600 transition-colors text-sm font-medium"
                title="Minha Carteira"
              >
                🪪 <span className="hidden sm:inline">Minha Carteira</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-teal-600 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Status Alerts */}
        {user.ativo === false && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-bold">Conta Bloqueada</h3>
              <p>Sua conta está bloqueada para novos empréstimos ou consultas. Dirija-se à biblioteca para regularizar sua situação.</p>
              {user.motivoBloqueio && <p className="mt-1 text-sm font-medium">Motivo: {user.motivoBloqueio}</p>}
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Active Loans */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              Meu Empréstimo Atual
            </h2>
            {activeLoans.length > 0 ? (
              <div className="space-y-4">
                {activeLoans.map(loan => {
                  const dataPrevista = new Date(loan.dataPrevista);
                  const atrasado = dataPrevista < now || loan.status === 'atrasado';
                  return (
                    <div key={loan.id} className={`p-4 rounded-lg border ${atrasado ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                      <h3 className="font-bold text-lg">{loan.book.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-3">{loan.book.autor}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Devolução até: {dataPrevista.toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${atrasado ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'}`}>
                          {atrasado ? 'ATRASADO' : 'No Prazo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>Nenhum empréstimo ativo no momento.</p>
              </div>
            )}
          </Card>

          {/* Active Consultations */}
          <Card>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Consulta Local
            </h2>
            {activeConsultations.length > 0 ? (
              <div className="space-y-4">
                {activeConsultations.map(cons => {
                  const vencida = cons.status === 'vencida' || new Date(cons.dataExpiracao) <= now;
                  return (
                    <div key={cons.id} className={`p-4 rounded-lg border ${vencida ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                      <h3 className="font-bold text-lg">{cons.book.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-3">{cons.book.autor}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Tempo Restante:
                        </span>
                        <span className={`font-mono font-bold text-lg ${vencida ? 'text-red-600' : 'text-yellow-600'}`}>
                          {formatTimeRemaining(cons.dataExpiracao)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>Nenhuma consulta local ativa.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Catalog Search */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-teal-600" />
            Catálogo da Biblioteca
          </h2>
          <div className="mb-6">
            <Input
              placeholder="Buscar livro por título ou autor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.length > 0 ? (
              books.map(book => (
                <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <h3 className="font-bold text-gray-800 line-clamp-1" title={book.titulo}>{book.titulo}</h3>
                  <p className="text-sm text-gray-600 mb-3">{book.autor}</p>
                  
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Gênero: {book.genero}</span>
                      <span className="text-xs text-gray-500 block mb-1">Estante: {book.estante || 'Não informada'}</span>
                    </div>
                    <div>
                      {book.consultaLocal ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded-full">
                          Apenas Consulta
                        </span>
                      ) : (book.quantidadeDisponivel || book.quantidade) > 0 ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                          Disponível ({book.quantidadeDisponivel || book.quantidade})
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
                          Indisponível
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <SearchX className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p>Nenhum livro encontrado com esse termo.</p>
              </div>
            )}
          </div>
        </Card>

      </main>
    </div>
  );
};

export default StudentDashboard;
