import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentoTributario, ApiResponse } from '@contaweb/shared-types';
import type { DocumentoInput } from '@contaweb/validations';
import api from '@/lib/api';

export function useDocumentos(empresaId: string) {
  return useQuery<ApiResponse<DocumentoTributario[]>>({
    queryKey: ['documentos', empresaId],
    queryFn: () =>
      api.get<ApiResponse<DocumentoTributario[]>>(`/api/empresas/${empresaId}/documentos`).then((r) => r.data),
    enabled: !!empresaId,
  });
}

export function useCreateDocumento(empresaId: string) {
  const qc = useQueryClient();
  return useMutation<ApiResponse<DocumentoTributario>, Error, DocumentoInput>({
    mutationFn: (data) =>
      api.post<ApiResponse<DocumentoTributario>>(`/api/empresas/${empresaId}/documentos`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentos', empresaId] });
      qc.invalidateQueries({ queryKey: ['f29', empresaId] });
    },
  });
}
