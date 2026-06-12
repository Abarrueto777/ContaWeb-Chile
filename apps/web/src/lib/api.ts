import axios from 'axios';

// En producción (mismo dominio), baseURL vacío usa URLs relativas (/api/...)
// En desarrollo, apunta al servidor local
const api = axios.create({
  baseURL: import.meta.env['VITE_API_URL'] ?? (import.meta.env.PROD ? '' : 'http://localhost:3001'),
  // Sin timeout, una request a un server caído/lento se cuelga PARA SIEMPRE (spinner infinito).
  // 30s cubre cualquier operación normal y falla con error si algo no responde.
  timeout: 30000,
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
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        // Sesión caída → a la landing pública (que ya tiene el login embebido),
        // salvo que ya estemos en una página pública (evita pisar el logout y loops).
        const path = window.location.pathname;
        if (path !== '/' && path !== '/login' && path !== '/registro') {
          window.location.href = '/';
        }
      }
      // 402: trial vencido sin suscripción → pantalla de suscripción.
      if (error.response?.status === 402 && window.location.pathname !== '/suscripcion') {
        window.location.href = '/suscripcion';
      }
      // Mostrar el mensaje real del backend ("Tu cuenta está suspendida…")
      // en vez del genérico "Request failed with status code XXX".
      const backendMsg = (error.response?.data as { error?: string } | undefined)?.error;
      if (backendMsg) error.message = backendMsg;
    }
    return Promise.reject(error);
  }
);

export default api;
