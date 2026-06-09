import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RPBien, RPPpmResumen, RentaPresuntaResult, ApiResponse } from '@contaweb/shared-types';
import type { RPBienInput, RPPpmInput } from '@contaweb/validations';
import api from '@/lib/api';

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
}

const base = (eid: string) => `/api/empresas/${eid}/renta-presunta`;

// ── Bienes ──────────────────────────────────────────────────────────
export function useRPBienes(empresaId: string) {
  return useQuery<ApiResponse<RPBien[]>>({
    queryKey: ['rp-bienes', empresaId],
    queryFn: () => api.get<ApiResponse<RPBien[]>>(`${base(empresaId)}/bienes`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateRPBien(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<RPBien>, Error, RPBienInput>({
    mutationFn: async (data) => {
      try { return await api.post<ApiResponse<RPBien>>(`${base(empresaId)}/bienes`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al registrar bien')); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp-bienes', empresaId] }); qc.invalidateQueries({ queryKey: ['rp-calculo', empresaId] }); },
  });
}

export function useUpdateRPBien(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<RPBien>, Error, { id: string; data: RPBienInput }>({
    mutationFn: async ({ id, data }) => {
      try { return await api.put<ApiResponse<RPBien>>(`${base(empresaId)}/bienes/${id}`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al actualizar bien')); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp-bienes', empresaId] }); qc.invalidateQueries({ queryKey: ['rp-calculo', empresaId] }); },
  });
}

export function useDeleteRPBien(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`${base(empresaId)}/bienes/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp-bienes', empresaId] }); qc.invalidateQueries({ queryKey: ['rp-calculo', empresaId] }); },
  });
}

// ── PPM ─────────────────────────────────────────────────────────────
export function useRPPpm(empresaId: string, anio: number) {
  return useQuery<ApiResponse<RPPpmResumen>>({
    queryKey: ['rp-ppm', empresaId, anio],
    queryFn: () => api.get<ApiResponse<RPPpmResumen>>(`${base(empresaId)}/ppm?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export function useGuardarRPPpm(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, RPPpmInput>({
    mutationFn: (data) => api.put(`${base(empresaId)}/ppm`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp-ppm', empresaId] }); qc.invalidateQueries({ queryKey: ['rp-calculo', empresaId] }); },
  });
}

export function usePagarRPPpm(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { id: string; pagado: boolean }>({
    mutationFn: ({ id, pagado }) => api.patch(`${base(empresaId)}/ppm/${id}/pagar`, { pagado }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['rp-ppm', empresaId] }); qc.invalidateQueries({ queryKey: ['rp-calculo', empresaId] }); },
  });
}

// ── Cálculo ─────────────────────────────────────────────────────────
export function useRentaPresuntaCalculo(empresaId: string, anio: number) {
  return useQuery<ApiResponse<RentaPresuntaResult>>({
    queryKey: ['rp-calculo', empresaId, anio],
    queryFn: () => api.get<ApiResponse<RentaPresuntaResult>>(`${base(empresaId)}/calculo?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}
