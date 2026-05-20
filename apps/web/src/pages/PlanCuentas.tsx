import { useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { usePlanCuentas } from '@/hooks/usePlanCuentas';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TipoCuenta } from '@contaweb/shared-types';

const TIPO_COLORS: Record<TipoCuenta, string> = {
  ACTIVO: 'text-blue-600',
  PASIVO: 'text-orange-600',
  PATRIMONIO: 'text-purple-600',
  INGRESO: 'text-green-600',
  GASTO: 'text-red-600',
};

const TIPO_BADGE: Record<TipoCuenta, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVO: 'default',
  PASIVO: 'secondary',
  PATRIMONIO: 'outline',
  INGRESO: 'default',
  GASTO: 'destructive',
};

export default function PlanCuentas() {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoCuenta | 'TODOS'>('TODOS');

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = usePlanCuentas(empresa?.id ?? '');

  const cuentas = (data?.data ?? []).filter((c) => {
    const matchTipo = tipoFiltro === 'TODOS' || c.tipo === tipoFiltro;
    const matchBusqueda = busqueda === '' ||
      c.codigo.includes(busqueda) ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchBusqueda;
  });

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan de Cuentas</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} — {cuentas.length} cuentas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código o nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['TODOS', 'ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tipoFiltro === t ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
            >
              {t === 'TODOS' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : cuentas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">Sin cuentas encontradas</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">Código</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Naturaleza</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Movimientos</th>
            </tr></thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${c.nivel === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="px-5 py-3">
                    <span className={`font-mono font-medium ${TIPO_COLORS[c.tipo]}`} style={{ paddingLeft: `${(c.nivel - 1) * 12}px` }}>
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ paddingLeft: `${20 + (c.nivel - 1) * 12}px` }}>
                    <span className={c.nivel === 1 ? 'font-semibold' : c.nivel === 2 ? 'font-medium' : 'text-muted-foreground'}>{c.nombre}</span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell"><Badge variant={TIPO_BADGE[c.tipo]} className="text-xs">{c.tipo}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell text-xs">{c.naturaleza}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {c.permiteMovimientos
                      ? <span className="text-xs text-green-600">Sí</span>
                      : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
