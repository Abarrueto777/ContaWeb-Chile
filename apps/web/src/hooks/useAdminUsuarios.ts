import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export interface AdminUsuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'ADMIN' | 'CONTADOR' | 'VISOR';
  estado: 'ACTIVO' | 'SUSPENDIDO';
  trialFin: string | null;
  suscripcionHasta: string | null;
  createdAt: string;
  _count: { empresas: number };
}

export function useAdminUsuarios() {
  return useQuery<ApiResponse<AdminUsuario[]>>({
    queryKey: ['admin', 'usuarios'],
    queryFn: () => api.get<ApiResponse<AdminUsuario[]>>('/api/admin/usuarios').then((r) => r.data),
  });
}

export function useUpdateEstadoUsuario() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUsuario>, Error, { id: string; estado: 'ACTIVO' | 'SUSPENDIDO' }>({
    mutationFn: ({ id, estado }) =>
      api.patch<ApiResponse<AdminUsuario>>(`/api/admin/usuarios/${id}/estado`, { estado }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  });
}

export function useActivarSuscripcion() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUsuario> & { message?: string }, Error, { id: string; meses: 1 | 6 | 12 }>({
    mutationFn: ({ id, meses }) =>
      api.patch<ApiResponse<AdminUsuario> & { message?: string }>(`/api/admin/usuarios/${id}/suscripcion`, { meses }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  });
}

export function useDeleteUsuario() {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete<{ message: string }>(`/api/admin/usuarios/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  });
}
