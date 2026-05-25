import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Empresa, ApiResponse } from '@contaweb/shared-types';
import type { EmpresaInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useEmpresas() {
  return useQuery<ApiResponse<Empresa[]>>({
    queryKey: ['empresas'],
    queryFn: () => api.get<ApiResponse<Empresa[]>>('/api/empresas').then((r) => r.data),
    enabled: !!localStorage.getItem('auth_token'),
  });
}

export function useEmpresa(id: string) {
  return useQuery<ApiResponse<Empresa>>({
    queryKey: ['empresas', id],
    queryFn: () => api.get<ApiResponse<Empresa>>(`/api/empresas/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateEmpresa() {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Empresa>, Error, EmpresaInput>({
    mutationFn: (data) => api.post<ApiResponse<Empresa>>('/api/empresas', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas'] }),
  });
}

export function useUpdateEmpresa(id: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Empresa>, Error, EmpresaInput>({
    mutationFn: (data) => api.put<ApiResponse<Empresa>>(`/api/empresas/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['empresas'] }),
  });
}
