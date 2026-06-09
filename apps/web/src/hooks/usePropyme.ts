import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProPymeResumen, RPPpmResumen, ApiResponse } from '@contaweb/shared-types';
import api from '@/lib/api';

const base = (eid: string) => `/api/empresas/${eid}/propyme`;

export function useProPymeResumen(empresaId: string, anio: number, mes: number | null) {
  const mesParam = mes ? `&mes=${mes}` : '';
  return useQuery<ApiResponse<ProPymeResumen>>({
    queryKey: ['propyme-resumen', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<ProPymeResumen>>(`${base(empresaId)}/resumen?anio=${anio}${mesParam}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export function useProPymePpm(empresaId: string, anio: number) {
  return useQuery<ApiResponse<RPPpmResumen>>({
    queryKey: ['propyme-ppm', empresaId, anio],
    queryFn: () => api.get<ApiResponse<RPPpmResumen>>(`${base(empresaId)}/ppm?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export function useSincronizarPpm(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ data: { actualizados: number }; message: string }, Error, number>({
    mutationFn: (anio) => api.post(`${base(empresaId)}/ppm/sincronizar?anio=${anio}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propyme-ppm', empresaId] });
      qc.invalidateQueries({ queryKey: ['propyme-resumen', empresaId] });
    },
  });
}

export function usePagarProPymePpm(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; pagado: boolean }>({
    mutationFn: ({ id, pagado }) => api.patch(`${base(empresaId)}/ppm/${id}/pagar`, { pagado }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['propyme-ppm', empresaId] });
      qc.invalidateQueries({ queryKey: ['propyme-resumen', empresaId] });
    },
  });
}
