import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Cliente, ApiResponse } from '@contaweb/shared-types';
import type { ClienteInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useClientes(empresaId: string) {
  return useQuery<ApiResponse<Cliente[]>>({
    queryKey: ['clientes', empresaId],
    queryFn: () =>
      api.get<ApiResponse<Cliente[]>>(`/api/empresas/${empresaId}/clientes`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateCliente(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Cliente>, Error, ClienteInput>({
    mutationFn: (data) =>
      api.post<ApiResponse<Cliente>>(`/api/empresas/${empresaId}/clientes`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', empresaId] }),
  });
}

export function useUpdateCliente(empresaId: string, clienteId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<Cliente>, Error, ClienteInput>({
    mutationFn: (data) =>
      api.put<ApiResponse<Cliente>>(`/api/empresas/${empresaId}/clientes/${clienteId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clientes', empresaId] }),
  });
}
