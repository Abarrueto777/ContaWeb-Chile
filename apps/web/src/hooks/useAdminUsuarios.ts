import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Usuario } from '@contaweb/shared-types';
import api from '@/lib/api';

// Subconjunto de Usuario que de verdad devuelve GET /api/admin/usuarios, más los
// campos propios del panel admin (estado, _count). Pick en vez de redefinir a mano
// para que agregar un campo a Usuario no quede desincronizado en silencio acá.
export interface AdminUsuario extends Pick<Usuario, 'id' | 'email' | 'nombre' | 'rol' | 'trialFin' | 'suscripcionHasta' | 'trialVigente' | 'suscripcionVigente' | 'diasRestantesTrial' | 'createdAt'> {
  estado: 'ACTIVO' | 'SUSPENDIDO';
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
  return useMutation<ApiResponse<AdminUsuario> & { message?: string }, Error, { id: string; meses: 1 | 6 | 12; correccion?: boolean }>({
    mutationFn: ({ id, meses, correccion }) =>
      api.patch<ApiResponse<AdminUsuario> & { message?: string }>(`/api/admin/usuarios/${id}/suscripcion`, { meses, correccion }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
  });
}

export function useQuitarSuscripcion() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<AdminUsuario> & { message?: string }, Error, string>({
    mutationFn: (id) =>
      api.delete<ApiResponse<AdminUsuario> & { message?: string }>(`/api/admin/usuarios/${id}/suscripcion`).then((r) => r.data),
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
