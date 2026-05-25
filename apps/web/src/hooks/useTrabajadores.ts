import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Trabajador, ApiResponse } from '@contaweb/shared-types';
import type { TrabajadorInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useTrabajadores(empresaId: string) {
  return useQuery<ApiResponse<Trabajador[]>>({
    queryKey: ['trabajadores', empresaId],
    queryFn: () => api.get<ApiResponse<Trabajador[]>>(`/api/empresas/${empresaId}/trabajadores`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateTrabajador(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Trabajador>, Error, TrabajadorInput>({
    mutationFn: (data) => api.post<ApiResponse<Trabajador>>(`/api/empresas/${empresaId}/trabajadores`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores', empresaId] }),
  });
}

export function useUpdateTrabajador(empresaId: string, trabajadorId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Trabajador>, Error, TrabajadorInput>({
    mutationFn: (data) => api.put<ApiResponse<Trabajador>>(`/api/empresas/${empresaId}/trabajadores/${trabajadorId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores', empresaId] }),
  });
}

export function useDesactivarTrabajador(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Trabajador>, Error, string>({
    mutationFn: (id) => api.patch<ApiResponse<Trabajador>>(`/api/empresas/${empresaId}/trabajadores/${id}/desactivar`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores', empresaId] }),
  });
}

export function useReactivarTrabajador(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Trabajador>, Error, string>({
    mutationFn: (id) => api.patch<ApiResponse<Trabajador>>(`/api/empresas/${empresaId}/trabajadores/${id}/reactivar`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trabajadores', empresaId] }),
  });
}
