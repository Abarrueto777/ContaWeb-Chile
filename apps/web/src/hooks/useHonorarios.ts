import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Honorario, ApiResponse } from '@contaweb/shared-types';
import type { HonorarioInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useHonorarios(empresaId: string, anio?: number, mes?: number) {
  const params = anio && mes ? `?anio=${anio}&mes=${mes}` : '';
  return useQuery<ApiResponse<Honorario[]>>({
    queryKey: ['honorarios', empresaId, anio, mes],
    queryFn: () =>
      api.get<ApiResponse<Honorario[]>>(`/api/empresas/${empresaId}/honorarios${params}`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateHonorario(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Honorario>, Error, HonorarioInput>({
    mutationFn: (data) =>
      api.post<ApiResponse<Honorario>>(`/api/empresas/${empresaId}/honorarios`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['honorarios', empresaId] });
      qc.invalidateQueries({ queryKey: ['f29', empresaId] });
    },
  });
}

export function useDeleteHonorario(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      api.delete(`/api/empresas/${empresaId}/honorarios/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['honorarios', empresaId] });
      qc.invalidateQueries({ queryKey: ['f29', empresaId] });
    },
  });
}
