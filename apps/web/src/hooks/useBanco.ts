import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CuentaBancaria, MovimientoBanco, ApiResponse } from '@contaweb/shared-types';
import type { CuentaBancariaInput, MovimientoBancoInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useCuentasBancarias(empresaId: string) {
  return useQuery<ApiResponse<CuentaBancaria[]>>({
    queryKey: ['banco', 'cuentas', empresaId],
    queryFn: () => api.get<ApiResponse<CuentaBancaria[]>>(`/api/empresas/${empresaId}/banco/cuentas`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateCuentaBancaria(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CuentaBancaria>, Error, CuentaBancariaInput>({
    mutationFn: (data) => api.post<ApiResponse<CuentaBancaria>>(`/api/empresas/${empresaId}/banco/cuentas`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banco', 'cuentas', empresaId] }),
  });
}

export function useMovimientosBanco(empresaId: string, cuentaId: string, anio?: number, mes?: number) {
  const params = anio && mes ? `?anio=${anio}&mes=${mes}` : '';
  return useQuery<ApiResponse<MovimientoBanco[]>>({
    queryKey: ['banco', 'movimientos', cuentaId, anio, mes],
    queryFn: () => api.get<ApiResponse<MovimientoBanco[]>>(`/api/empresas/${empresaId}/banco/cuentas/${cuentaId}/movimientos${params}`).then((r) => r.data),
    enabled: !!cuentaId,
  });
}

export function useCreateMovimiento(empresaId: string, cuentaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<MovimientoBanco>, Error, MovimientoBancoInput>({
    mutationFn: (data) => api.post<ApiResponse<MovimientoBanco>>(`/api/empresas/${empresaId}/banco/cuentas/${cuentaId}/movimientos`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banco', 'movimientos', cuentaId] }),
  });
}

export function useDeleteMovimiento(empresaId: string, cuentaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/banco/cuentas/${cuentaId}/movimientos/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banco', 'movimientos', cuentaId] }),
  });
}

export function useConciliar(empresaId: string, cuentaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<MovimientoBanco>, Error, string>({
    mutationFn: (id) => api.patch<ApiResponse<MovimientoBanco>>(`/api/empresas/${empresaId}/banco/cuentas/${cuentaId}/movimientos/${id}/conciliar`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banco', 'movimientos', cuentaId] }),
  });
}
