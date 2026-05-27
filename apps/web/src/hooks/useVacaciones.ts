import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vacacion, VacacionSaldo, ApiResponse } from '@contaweb/shared-types';
import type { VacacionInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useVacaciones(empresaId: string, trabajadorId?: string) {
  const params = trabajadorId ? `?trabajadorId=${trabajadorId}` : '';
  return useQuery<ApiResponse<Vacacion[]>>({
    queryKey: ['vacaciones', empresaId, trabajadorId],
    queryFn: () => api.get<ApiResponse<Vacacion[]>>(`/api/empresas/${empresaId}/vacaciones${params}`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useVacacionSaldos(empresaId: string) {
  return useQuery<ApiResponse<VacacionSaldo[]>>({
    queryKey: ['vacaciones-saldos', empresaId],
    queryFn: () => api.get<ApiResponse<VacacionSaldo[]>>(`/api/empresas/${empresaId}/vacaciones/saldos`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateVacacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Vacacion>, Error, VacacionInput>({
    mutationFn: (data) => api.post<ApiResponse<Vacacion>>(`/api/empresas/${empresaId}/vacaciones`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacaciones', empresaId] });
      qc.invalidateQueries({ queryKey: ['vacaciones-saldos', empresaId] });
    },
  });
}

export function useDeleteVacacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/vacaciones/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vacaciones', empresaId] });
      qc.invalidateQueries({ queryKey: ['vacaciones-saldos', empresaId] });
    },
  });
}
