import { useState, useEffect } from 'react';
import { studentService, loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAutoLogout } from '../hooks/useAutoLogout';
import StudentCard from '../components/StudentCard';

const StudentWallet = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useAutoLogout();

  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dashRes = await studentService.getDashboard();
      if (dashRes.data?.data?.loans) {
        setLoans(dashRes.data.data.loans);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da carteira:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px 16px 60px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24
      }}>
        <button
          onClick={() => navigate('/aluno/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          ← Dashboard
        </button>
        <h1 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
          Minha Carteira
        </h1>
        <button
          onClick={logout}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: 'white',
            borderRadius: 10,
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)'
          }}
        >
          Sair
        </button>
      </div>

      {/* Card do Aluno */}
      <StudentCard
        user={user}
        loans={loans}
        onClose={() => navigate('/aluno/dashboard')}
      />

      {/* Instrução */}
      <div style={{
        marginTop: 16,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        padding: '14px 20px',
        maxWidth: 380,
        width: '100%',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        💡 Apresente este código de barras na biblioteca para empréstimos rápidos com o leitor óptico.
      </div>
    </div>
  );
};

export default StudentWallet;
