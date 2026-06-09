import { useQuery } from '@tanstack/react-query';
import type { DJ1879Result, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export function useDJ1879(empresaId: string, anio: number) {
  return useQuery<ApiResponse<DJ1879Result>>({
    queryKey: ['dj1879', empresaId, anio],
    queryFn: () => api.get<ApiResponse<DJ1879Result>>(`/api/empresas/${empresaId}/dj1879?anio=${anio}`).then((r) => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export async function descargarDJ1879Txt(empresaId: string, anio: number) {
  const res = await api.get(`/api/empresas/${empresaId}/dj1879/txt?anio=${anio}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DJ1879_${anio}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
