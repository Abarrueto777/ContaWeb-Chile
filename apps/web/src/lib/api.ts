import axios from 'axios';

// En producción (mismo dominio), baseURL vacío usa URLs relativas (/api/...)
// En desarrollo, apunta al servidor local
const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? (import.meta.env.PROD ? '' : 'http://localhost:3001'),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
