import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService, userService, loanService } from '../services/api';
import Card from '../components/ui/Card';
import { BookOpen, Users, ArrowRightLeft, AlertTriangle, Library } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link} className="block">
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </div>
    </Card>
  </Link>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    books: { total: 0, disponiveis: 0, emprestados: 0 },
    users: { total: 0 },
    loans: { ativos: 0, atrasados: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [bookStats, userData, loanStats] = await Promise.all([
          bookService.getStats(),
          userService.getAll({ limit: 1 }),
          loanService.getStats()
        ]);

        setStats({
          books: bookStats.data.data,
          users: { total: userData.data.data.total },
          loans: loanStats.data.data
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Livros"
          value={stats.books.total}
          icon={BookOpen}
          color="bg-blue-100 text-blue-600"
          link="/books"
        />
        <StatCard
          title="Livros Disponíveis"
          value={stats.books.disponiveis}
          icon={Library}
          color="bg-green-100 text-green-600"
          link="/books"
        />
        <StatCard
          title="Usuários Cadastrados"
          value={stats.users.total}
          icon={Users}
          color="bg-purple-100 text-purple-600"
          link="/users"
        />
        <StatCard
          title="Empréstimos Ativos"
          value={stats.loans.ativos}
          icon={ArrowRightLeft}
          color="bg-orange-100 text-orange-600"
          link="/loans"
        />
      </div>

      {/* Alerts */}
      {stats.loans.atrasados > 0 && (
        <Card className="mb-6 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <p className="font-medium">
              Existem {stats.loans.atrasados} empréstimo(s) atrasado(s)!
            </p>
            <Link to="/loans" className="ml-auto text-sm underline">
              Ver detalhes
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Ações Rápidas">
          <div className="space-y-3">
            <Link
              to="/books/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Cadastrar Novo Livro</span>
            </Link>
            <Link
              to="/users/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700">Cadastrar Novo Usuário</span>
            </Link>
            <Link
              to="/loans/new"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">Novo Empréstimo</span>
            </Link>
          </div>
        </Card>

        <Card title="Resumo">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Livros Emprestados</span>
              <span className="font-semibold text-gray-800">{stats.books.emprestados}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Empréstimos Ativos</span>
              <span className="font-semibold text-gray-800">{stats.loans.ativos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Empréstimos Devolvidos</span>
              <span className="font-semibold text-gray-800">{stats.loans.devolvidos}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;