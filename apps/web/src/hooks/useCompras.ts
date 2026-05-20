import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { FacturaRecibida, ApiResponse } from '@contaweb/shared-types';
import type { FacturaRecibidaInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useCompras(empresaId: string, anio?: number, mes?: number) {
  const params = anio && mes ? `?anio=${anio}&mes=${mes}` : '';
  return useQuery<ApiResponse<FacturaRecibida[]>>({
    queryKey: ['compras', empresaId, anio, mes],
    queryFn: () =>
      api.get<ApiResponse<FacturaRecibida[]>>(`/api/empresas/${empresaId}/compras${params}`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateCompra(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<FacturaRecibida>, Error, FacturaRecibidaInput>({
    mutationFn: (data) =>
      api.post<ApiResponse<FacturaRecibida>>(`/api/empresas/${empresaId}/compras`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras', empresaId] });
      qc.invalidateQueries({ queryKey: ['f29', empresaId] });
    },
  });
}

export function useDeleteCompra(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) =>
      api.delete(`/api/empresas/${empresaId}/compras/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compras', empresaId] });
      qc.invalidateQueries({ queryKey: ['f29', empresaId] });
    },
  });
}
