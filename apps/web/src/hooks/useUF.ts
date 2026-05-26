import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface ValorUFUTM {
  id: string;
  anio: number;
  mes: number;
  uf: number;
  utm: number;
  imm: number;
  afpCapital: number;
  afpCuprum: number;
  afpHabitat: number;
  afpPlanvital: number;
  afpProvida: number;
  afpModelo: number;
  afpUno: number;
}

interface ApiResponse<T> { data: T; fallback?: boolean }

export function useValoresUF() {
  return useQuery<ApiResponse<ValorUFUTM[]>>({
    queryKey: ['uf'],
    queryFn: () => api.get<ApiResponse<ValorUFUTM[]>>('/api/uf').then((r) => r.data),
  });
}

export function useValorUFMes(anio: number, mes: number) {
  return useQuery<ApiResponse<ValorUFUTM>>({
    queryKey: ['uf', anio, mes],
    queryFn: () => api.get<ApiResponse<ValorUFUTM>>(`/api/uf/${anio}/${mes}`).then((r) => r.data),
    enabled: !!anio && !!mes,
  });
}

export interface UpsertUFInput {
  anio: number; mes: number; uf: number; utm: number; imm: number;
  afpCapital?: number; afpCuprum?: number; afpHabitat?: number; afpPlanvital?: number;
  afpProvida?: number; afpModelo?: number; afpUno?: number;
}

export function useUpsertValorUF() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<ValorUFUTM>, Error, UpsertUFInput>({
    mutationFn: (data) => api.post<ApiResponse<ValorUFUTM>>('/api/uf', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['uf'] }),
  });
}
