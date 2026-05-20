import { useEmpresas } from './useEmpresas';

export function useEmpresaActual() {
  const { data, isLoading } = useEmpresas();
  const empresas = data?.data ?? [];
  const primera = empresas[0] ?? null;
  return { empresa: primera, empresas, isLoading };
}
