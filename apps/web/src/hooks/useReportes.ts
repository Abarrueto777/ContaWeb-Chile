import { useQuery } from '@tanstack/react-query';
import type { LibroDiarioEntry, LibroMayorEntry, BalanceEntry, ResultadosData, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export function useLibroDiario(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<LibroDiarioEntry[]>>({
    queryKey: ['reportes', 'diario', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<LibroDiarioEntry[]>>(`/api/empresas/${empresaId}/reportes/libro-diario?anio=${anio}&mes=${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}

export function useLibroMayor(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<LibroMayorEntry[]>>({
    queryKey: ['reportes', 'mayor', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<LibroMayorEntry[]>>(`/api/empresas/${empresaId}/reportes/libro-mayor?anio=${anio}&mes=${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}

export function useBalance(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<BalanceEntry[]>>({
    queryKey: ['reportes', 'balance', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<BalanceEntry[]>>(`/api/empresas/${empresaId}/reportes/balance?anio=${anio}&mes=${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}

export function useResultados(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<ResultadosData>>({
    queryKey: ['reportes', 'resultados', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<ResultadosData>>(`/api/empresas/${empresaId}/reportes/resultados?anio=${anio}&mes=${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}
