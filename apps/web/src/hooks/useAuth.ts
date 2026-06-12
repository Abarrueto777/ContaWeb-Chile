import { useQuery, useMutation } from '@tanstack/react-query';
import type { ApiResponse, Usuario } from '@contaweb/shared-types';
import type { LoginInput, RegistroInput } from '@contaweb/validations';
import api from '@/lib/api';

interface AuthResponse {
  data: {
    token: string;
    usuario: Usuario;
  };
}

export function useMe() {
  return useQuery<ApiResponse<Usuario>>({
    queryKey: ['me'],
    queryFn: () => api.get<ApiResponse<Usuario>>('/api/auth/me').then((r) => r.data),
    enabled: !!localStorage.getItem('auth_token'),
    staleTime: 5 * 60 * 1000,
  });
}

// Login/registro hacen recarga COMPLETA (no SPA): así toda la app se reconstruye
// fresca con el usuario nuevo y no queda ningún dato cacheado del usuario anterior
// (el EmpresaProvider y demás providers viven montados y no se refrescaban solos).
export function useLogin() {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: (data) => api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),
    onSuccess: ({ data }) => {
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/dashboard';
    },
  });
}

export function useRegistro() {
  return useMutation<AuthResponse, Error, RegistroInput>({
    mutationFn: (data) => api.post<AuthResponse>('/api/auth/registro', data).then((r) => r.data),
    onSuccess: ({ data }) => {
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/dashboard';
    },
  });
}

export function useLogout() {
  return () => {
    localStorage.removeItem('auth_token');
    window.location.href = '/';
  };
}
