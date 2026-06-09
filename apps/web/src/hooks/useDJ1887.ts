import { useQuery } from '@tanstack/react-query';
import type { DJ1887Result, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export function useDJ1887(empresaId: string, anio: number) {
  return useQuery<ApiResponse<DJ1887Result>>({
    queryKey: ['dj1887', empresaId, anio],
    queryFn: () =>
      api.get<ApiResponse<DJ1887Result>>(`/api/empresas/${empresaId}/dj1887?anio=${anio}`).then((r) => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export async function descargarDJ1887Txt(empresaId: string, anio: number) {
  const res = await api.get(`/api/empresas/${empresaId}/dj1887/txt?anio=${anio}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DJ1887_${anio}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
