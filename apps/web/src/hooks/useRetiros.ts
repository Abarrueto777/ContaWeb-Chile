import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Socio, Retiro, DJ1886Result, DJ1948Result, ApiResponse } from '@contaweb/shared-types';
import type { SocioInput, RetiroInput } from '@contaweb/validations';
import api from '@/lib/api';

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } }).response?.data?.error ?? fallback;
}

// ── Socios ──────────────────────────────────────────────────────────
export function useSocios(empresaId: string) {
  return useQuery<ApiResponse<Socio[]>>({
    queryKey: ['socios', empresaId],
    queryFn: () => api.get<ApiResponse<Socio[]>>(`/api/empresas/${empresaId}/socios`).then(r => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateSocio(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Socio>, Error, SocioInput>({
    mutationFn: async (data) => {
      try { return await api.post<ApiResponse<Socio>>(`/api/empresas/${empresaId}/socios`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al registrar socio')); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['socios', empresaId] }); },
  });
}

export function useUpdateSocio(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Socio>, Error, { id: string; data: SocioInput }>({
    mutationFn: async ({ id, data }) => {
      try { return await api.put<ApiResponse<Socio>>(`/api/empresas/${empresaId}/socios/${id}`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al actualizar socio')); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['socios', empresaId] }); },
  });
}

export function useDeleteSocio(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/socios/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['socios', empresaId] });
      qc.invalidateQueries({ queryKey: ['retiros', empresaId] });
    },
  });
}

// ── Retiros ─────────────────────────────────────────────────────────
export function useRetiros(empresaId: string, anio: number) {
  return useQuery<ApiResponse<Retiro[]>>({
    queryKey: ['retiros', empresaId, anio],
    queryFn: () => api.get<ApiResponse<Retiro[]>>(`/api/empresas/${empresaId}/retiros?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export function useCreateRetiro(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Retiro>, Error, RetiroInput>({
    mutationFn: async (data) => {
      try { return await api.post<ApiResponse<Retiro>>(`/api/empresas/${empresaId}/retiros`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al registrar retiro')); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retiros', empresaId] });
      qc.invalidateQueries({ queryKey: ['dj1886', empresaId] });
    },
  });
}

export function useUpdateRetiro(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Retiro>, Error, { id: string; data: RetiroInput }>({
    mutationFn: async ({ id, data }) => {
      try { return await api.put<ApiResponse<Retiro>>(`/api/empresas/${empresaId}/retiros/${id}`, data).then(r => r.data); }
      catch (err) { throw new Error(errMsg(err, 'Error al actualizar retiro')); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retiros', empresaId] });
      qc.invalidateQueries({ queryKey: ['dj1886', empresaId] });
    },
  });
}

export function useDeleteRetiro(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => api.delete(`/api/empresas/${empresaId}/retiros/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retiros', empresaId] });
      qc.invalidateQueries({ queryKey: ['dj1886', empresaId] });
    },
  });
}

// ── DJ 1886 ─────────────────────────────────────────────────────────
export function useDJ1886(empresaId: string, anio: number) {
  return useQuery<ApiResponse<DJ1886Result>>({
    queryKey: ['dj1886', empresaId, anio],
    queryFn: () => api.get<ApiResponse<DJ1886Result>>(`/api/empresas/${empresaId}/dj1886?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export async function descargarDJ1886Txt(empresaId: string, anio: number) {
  const res = await api.get(`/api/empresas/${empresaId}/dj1886/txt?anio=${anio}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DJ1886_${anio}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── DJ 1948 ─────────────────────────────────────────────────────────
export function useDJ1948(empresaId: string, anio: number) {
  return useQuery<ApiResponse<DJ1948Result>>({
    queryKey: ['dj1948', empresaId, anio],
    queryFn: () => api.get<ApiResponse<DJ1948Result>>(`/api/empresas/${empresaId}/dj1948?anio=${anio}`).then(r => r.data),
    enabled: !!empresaId && !!anio,
  });
}

export function useRecalcularRetiros(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ data: { actualizados: number }; message: string }, Error, number>({
    mutationFn: (anio) => api.post(`/api/empresas/${empresaId}/dj1948/recalcular?anio=${anio}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retiros', empresaId] });
      qc.invalidateQueries({ queryKey: ['dj1886', empresaId] });
      qc.invalidateQueries({ queryKey: ['dj1948', empresaId] });
    },
  });
}
