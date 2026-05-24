import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

export const useAutoLogout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    let timeoutId;

    const handleActivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        navigate(user.role === 'student' ? '/aluno/login' : '/login');
      }, INACTIVITY_LIMIT_MS);
    };

    // Registrar eventos de atividade
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Iniciar timer
    handleActivity();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, logout, navigate, location.pathname]); // location.pathname para resetar em mudança de rota
};
