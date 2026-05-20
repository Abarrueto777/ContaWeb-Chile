import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ActivoFijo, ApiResponse } from '@contaweb/shared-types';
import type { ActivoFijoInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useActivos(empresaId: string) {
  return useQuery<ApiResponse<ActivoFijo[]>>({
    queryKey: ['activos', empresaId],
    queryFn: () => api.get<ApiResponse<ActivoFijo[]>>(`/api/empresas/${empresaId}/activos`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateActivo(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ActivoFijo>, Error, ActivoFijoInput>({
    mutationFn: (data) => api.post<ApiResponse<ActivoFijo>>(`/api/empresas/${empresaId}/activos`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activos', empresaId] }),
  });
}

export function useDepreciarActivo(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ActivoFijo>, Error, string>({
    mutationFn: (id) => api.post<ApiResponse<ActivoFijo>>(`/api/empresas/${empresaId}/activos/${id}/depreciar`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activos', empresaId] }),
  });
}

export function useBajaActivo(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/activos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activos', empresaId] }),
  });
}
