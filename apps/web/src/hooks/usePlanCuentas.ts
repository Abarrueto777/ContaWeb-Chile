import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CuentaContable, ApiResponse } from '@contaweb/shared-types';
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
  return useMutation<ApiResponse<CuentaContable>, Error, Partial<CuentaContable>>({
    mutationFn: (data) => api.post<ApiResponse<CuentaContable>>(`/api/empresas/${empresaId}/cuentas`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas', empresaId] }),
  });
}
