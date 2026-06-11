import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CuentaContable, ApiResponse } from '@contaweb/shared-types';
import type { CuentaContableInput, CuentaContableUpdateInput } from '@contaweb/validations';
import api from '@/lib/api';

export function usePlanCuentas(empresaId: string) {
  return useQuery<ApiResponse<CuentaContable[]>>({
    queryKey: ['cuentas', empresaId],
    queryFn: () => api.get<ApiResponse<CuentaContable[]>>(`/api/empresas/${empresaId}/cuentas`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateCuenta(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CuentaContable>, Error, CuentaContableInput>({
    mutationFn: (data) => api.post<ApiResponse<CuentaContable>>(`/api/empresas/${empresaId}/cuentas`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas', empresaId] }),
  });
}

export function useUpdateCuenta(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<CuentaContable>, Error, { cuentaId: string; data: CuentaContableUpdateInput }>({
    mutationFn: ({ cuentaId, data }) =>
      api.put<ApiResponse<CuentaContable>>(`/api/empresas/${empresaId}/cuentas/${cuentaId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas', empresaId] }),
  });
}

export function useDeleteCuenta(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (cuentaId) =>
      api.delete<{ message: string }>(`/api/empresas/${empresaId}/cuentas/${cuentaId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas', empresaId] }),
  });
}
