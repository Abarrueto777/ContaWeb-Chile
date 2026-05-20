import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@contaweb/shared-types';
import type { AsientoInput } from '@contaweb/validations';
import api from '@/lib/api';

export interface LineaAsiento {
  id: string; cuentaId: string; debe: string; haber: string; glosa: string | null;
  cuenta: { codigo: string; nombre: string };
}
export interface Asiento {
  id: string; numero: number; fecha: string; glosa: string;
  lineas: LineaAsiento[];
}

export function useAsientos(empresaId: string, anio: number, mes: number) {
  return useQuery<ApiResponse<Asiento[]>>({
    queryKey: ['asientos', empresaId, anio, mes],
    queryFn: () => api.get<ApiResponse<Asiento[]>>(`/api/empresas/${empresaId}/asientos`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateAsiento(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Asiento>, Error, AsientoInput>({
    mutationFn: (data) => api.post<ApiResponse<Asiento>>(`/api/empresas/${empresaId}/asientos`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asientos', empresaId] });
      qc.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
}
