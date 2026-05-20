import { useQuery } from '@tanstack/react-query';
import type { F29Result, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export function useF29(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<F29Result>>({
    queryKey: ['f29', empresaId, anio, mes],
    queryFn: () =>
      api.get<ApiResponse<F29Result>>(`/api/empresas/${empresaId}/f29/${anio}/${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}
