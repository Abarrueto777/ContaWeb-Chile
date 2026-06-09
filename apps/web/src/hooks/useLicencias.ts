import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LicenciaMedica, ApiResponse } from '@contaweb/shared-types';
import type { LicenciaMedicaInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useLicencias(empresaId: string, trabajadorId?: string) {
  const params = trabajadorId ? `?trabajadorId=${trabajadorId}` : '';
  return useQuery<ApiResponse<LicenciaMedica[]>>({
    queryKey: ['licencias', empresaId, trabajadorId],
    queryFn: () => api.get<ApiResponse<LicenciaMedica[]>>(`/api/empresas/${empresaId}/licencias${params}`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateLicencia(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<LicenciaMedica>, Error, LicenciaMedicaInput>({
    mutationFn: async (data) => {
      try {
        return await api.post<ApiResponse<LicenciaMedica>>(`/api/empresas/${empresaId}/licencias`, data).then(r => r.data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        throw new Error(msg ?? 'Error al registrar licencia médica');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licencias', empresaId] });
      qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] });
    },
  });
}

export function useUpdateLicencia(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<LicenciaMedica>, Error, { id: string; data: LicenciaMedicaInput }>({
    mutationFn: async ({ id, data }) => {
      try {
        return await api.put<ApiResponse<LicenciaMedica>>(`/api/empresas/${empresaId}/licencias/${id}`, data).then(r => r.data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        throw new Error(msg ?? 'Error al actualizar licencia médica');
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licencias', empresaId] });
      qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] });
    },
  });
}

export function useDeleteLicencia(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/licencias/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['licencias', empresaId] });
      qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] });
    },
  });
}
