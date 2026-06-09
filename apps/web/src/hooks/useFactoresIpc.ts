import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FactorIpc, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export function useFactoresIpc(anio: number) {
  return useQuery<ApiResponse<FactorIpc[]>>({
    queryKey: ['factores-ipc', anio],
    queryFn: () => api.get<ApiResponse<FactorIpc[]>>(`/api/factores-ipc?anio=${anio}`).then(r => r.data),
    enabled: !!anio,
  });
}

export function useUpsertFactorIpc() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<FactorIpc>, Error, { anio: number; mes: number; factor: number }>({
    mutationFn: (data) => api.put<ApiResponse<FactorIpc>>('/api/factores-ipc', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['factores-ipc'] });
      qc.invalidateQueries({ queryKey: ['dj1887'] });
    },
  });
}
