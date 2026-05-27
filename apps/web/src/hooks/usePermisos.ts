import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Permiso, ApiResponse } from '@contaweb/shared-types';
import type { PermisoInput } from '@contaweb/validations';
import api from '@/lib/api';

export function usePermisos(empresaId: string, trabajadorId?: string) {
  const params = trabajadorId ? `?trabajadorId=${trabajadorId}` : '';
  return useQuery<ApiResponse<Permiso[]>>({
    queryKey: ['permisos', empresaId, trabajadorId],
    queryFn: () => api.get<ApiResponse<Permiso[]>>(`/api/empresas/${empresaId}/permisos${params}`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useCreatePermiso(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Permiso>, Error, PermisoInput>({
    mutationFn: async (data) => {
      try {
        return await api.post<ApiResponse<Permiso>>(`/api/empresas/${empresaId}/permisos`, data).then(r => r.data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        throw new Error(msg ?? 'Error al registrar permiso');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permisos', empresaId] });
    },
  });
}

export function useDeletePermiso(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/permisos/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['permisos', empresaId] });
    },
  });
}
