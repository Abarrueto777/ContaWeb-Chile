import { useEmpresaContext, type EmpresaContextValue } from '@/components/EmpresaProvider';

export function useEmpresaActual(): EmpresaContextValue {
  return useEmpresaContext();
}
