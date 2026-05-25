import { createContext, useContext, useEffect, useState } from 'react';
import { useEmpresas } from '@/hooks/useEmpresas';
import type { Empresa } from '@contaweb/shared-types';

export interface EmpresaContextValue {
  empresa: Empresa | null;
  empresas: Empresa[];
  isLoading: boolean;
  setEmpresaId: (id: string) => void;
}

const EmpresaContext = createContext<EmpresaContextValue>({
  empresa: null,
  empresas: [],
  isLoading: false,
  setEmpresaId: () => {},
});

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useEmpresas();
  const empresas = (data?.data ?? []) as Empresa[];

  const [empresaId, setEmpresaIdState] = useState<string | null>(() =>
    localStorage.getItem('cw-empresa-id'),
  );

  useEffect(() => {
    if (empresas.length === 0) return;
    const found = empresas.find((e) => e.id === empresaId);
    if (!found && empresas[0]) {
      setEmpresaIdState(empresas[0].id);
      localStorage.setItem('cw-empresa-id', empresas[0].id);
    }
  }, [empresas, empresaId]);

  const empresa = empresas.find((e) => e.id === empresaId) ?? empresas[0] ?? null;

  function setEmpresaId(id: string) {
    setEmpresaIdState(id);
    localStorage.setItem('cw-empresa-id', id);
  }

  return (
    <EmpresaContext.Provider value={{ empresa, empresas, isLoading, setEmpresaId }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresaContext() {
  return useContext(EmpresaContext);
}
