import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Liquidacion, ApiResponse } from '@contaweb/shared-types';
import type { LiquidacionInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useLiquidaciones(empresaId: string, anio?: number, mes?: number) {
  const params = anio && mes ? `?anio=${anio}&mes=${mes}` : '';
  return useQuery<ApiResponse<Liquidacion[]>>({
    queryKey: ['liquidaciones', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<Liquidacion[]>>(`/api/empresas/${empresaId}/liquidaciones${params}`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateLiquidacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Liquidacion>, Error, LiquidacionInput>({
    mutationFn: (data) => api.post<ApiResponse<Liquidacion>>(`/api/empresas/${empresaId}/liquidaciones`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] }),
  });
}

export function useUpdateLiquidacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Liquidacion>, Error, { id: string; data: LiquidacionInput }>({
    mutationFn: ({ id, data }) => api.put<ApiResponse<Liquidacion>>(`/api/empresas/${empresaId}/liquidaciones/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] }),
  });
}

export function useDeleteLiquidacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/liquidaciones/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] }),
  });
}

export function usePagarLiquidacion(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Liquidacion>, Error, string>({
    mutationFn: (id) => api.patch<ApiResponse<Liquidacion>>(`/api/empresas/${empresaId}/liquidaciones/${id}/pagar`, {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] }),
  });
}

export function useCentralizarRemuneraciones(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ data: { id: string; numero: number }; message: string }, Error, { anio: number; mes: number }>({
    mutationFn: ({ anio, mes }) =>
      api.patch(`/api/empresas/${empresaId}/liquidaciones/centralizar?anio=${anio}&mes=${mes}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liquidaciones', empresaId] });
      qc.invalidateQueries({ queryKey: ['asientos', empresaId] });
    },
  });
}
