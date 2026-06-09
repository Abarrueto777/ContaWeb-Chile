import { useQuery } from '@tanstack/react-query';
import type { F22Result, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export interface F22Ajustes {
  gastosRechazados: number;
  ajustes: number;
  creditoPpm: number;
  creditoSence: number;
  creditoDonaciones: number;
  creditoOtros: number;
  retenciones: number;
}

export function useF22(empresaId: string, anio: number, ajustes: F22Ajustes) {
  const params = new URLSearchParams({ anio: String(anio) });
  for (const [k, v] of Object.entries(ajustes)) {
    if (v) params.set(k, String(v));
  }
  return useQuery<ApiResponse<F22Result>>({
    queryKey: ['f22', empresaId, anio, ajustes],
    queryFn: () => api.get<ApiResponse<F22Result>>(`/api/empresas/${empresaId}/f22?${params.toString()}`).then((r) => r.data),
    enabled: !!empresaId && !!anio,
  });
}
