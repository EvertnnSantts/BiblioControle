import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://biblio-controle.vercel.app/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Books
export const bookService = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
  getStats: () => api.get('/books/stats'),
  getGeneros: () => api.get('/books/generos'),
  getAutores: () => api.get('/books/autores')
};

// Users
export const userService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  block: (id, data) => api.post(`/users/${id}/block`, data),
  getCursos: () => api.get('/users/cursos'),
  getTurmas: () => api.get('/users/turmas'),
  search: (query) => api.get('/users/search', { params: { q: query } })
};

// Loans
export const loanService = {
  getAll: (params) => api.get('/loans', { params }),
  getActive: () => api.get('/loans/active'),
  create: (data) => api.post('/loans', data),
  return: (id, data) => api.post(`/loans/${id}/return`, data),
  getStats: () => api.get('/loans/stats'),
  getTurmas: () => api.get('/loans/turmas')
};

// Local Consultations
export const localConsultationService = {
  getAll: (params) => api.get('/local-consultations', { params }),
  getActive: () => api.get('/local-consultations/active'),
  create: (data) => api.post('/local-consultations', data),
  return: (id, data) => api.post(`/local-consultations/${id}/return`, data),
  getStats: () => api.get('/local-consultations/stats')
};

// Attendance
export const attendanceService = {
  createList: (data) => api.post('/attendance/lists', data),
  getLists: (params) => api.get('/attendance/lists', { params }),
  getListById: (id) => api.get(`/attendance/lists/${id}`),
  deleteList: (id) => api.delete(`/attendance/lists/${id}`),
  registerEntry: (data) => api.post('/attendance/records/entry', data),
  registerExit: (id, data) => api.post(`/attendance/records/${id}/exit`, data),
  adminRegisterExit: (id) => api.post(`/attendance/records/${id}/admin-exit`)
};

export default api;