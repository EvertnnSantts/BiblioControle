import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      authService.getMe()
        .then(res => {
          const data = res.data.data;
          setUser(data.admin || data.user);
        })
        .catch(() => {
          sessionStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login({ email, password });
    const { token, admin } = response.data.data;
    sessionStorage.setItem('token', token);
    setUser(admin);
    return response.data;
  };

  const studentLogin = async (email, password) => {
    const response = await authService.studentLogin({ email, password });
    const { token, user } = response.data.data;
    sessionStorage.setItem('token', token);
    setUser({ ...user, role: 'student' });
    return response.data;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, studentLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};