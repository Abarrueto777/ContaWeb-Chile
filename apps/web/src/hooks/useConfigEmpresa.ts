import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

type ConfigMap = Record<string, string>;
interface ApiResponse<T> { data: T }

export function useConfigEmpresa(empresaId: string) {
  return useQuery<ApiResponse<ConfigMap>>({
    queryKey: ['config-empresa', empresaId],
    queryFn: () => api.get<ApiResponse<ConfigMap>>(`/api/empresas/${empresaId}/config`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useUpdateConfigEmpresa(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ConfigMap>, Error, ConfigMap>({
    mutationFn: (data) => api.put<ApiResponse<ConfigMap>>(`/api/empresas/${empresaId}/config`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config-empresa', empresaId] }),
  });
}
