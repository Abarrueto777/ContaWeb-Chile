import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

export function useLogin() {
  const navigate = useNavigate();
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: (data) => api.post<AuthResponse>('/api/auth/login', data).then((r) => r.data),
    onSuccess: ({ data }) => {
      localStorage.setItem('auth_token', data.token);
      navigate('/');
    },
  });
}

export function useRegistro() {
  const navigate = useNavigate();
  return useMutation<AuthResponse, Error, RegistroInput>({
    mutationFn: (data) => api.post<AuthResponse>('/api/auth/registro', data).then((r) => r.data),
    onSuccess: ({ data }) => {
      localStorage.setItem('auth_token', data.token);
      navigate('/');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };
}
