import { useQuery } from '@tanstack/react-query';
import type { LibroDiarioEntry, LibroMayorEntry, BalanceEntry, ResultadosData, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

export interface Balance8Row {
  codigo: string; nombre: string; tipo: string; nivel: number;
  sumaDebe: number; sumaHaber: number;
  saldoDeudor: number; saldoAcreedor: number;
  balanceActivo: number; balancePasivo: number;
  debeResultado: number; haberResultado: number;
}
export interface Balance8Data {
  rows: Balance8Row[];
  totales: Omit<Balance8Row, 'codigo' | 'nombre' | 'tipo' | 'nivel'>;
  utilidad: number;
}

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

export function useBalance8(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<Balance8Data>>({
    queryKey: ['reportes', 'balance8', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<Balance8Data>>(`/api/empresas/${empresaId}/reportes/balance8?anio=${anio}&mes=${mes}`).then((r) => r.data),
    enabled: !!empresaId && !!anio && !!mes,
  });
}
