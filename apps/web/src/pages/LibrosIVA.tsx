import { useState } from 'react';
import { FileText, ShoppingCart } from 'lucide-react';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useCompras } from '@/hooks/useCompras';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

type Libro = 'ventas' | 'compras';

export default function LibrosIVA() {
  const hoy = new Date();
  const [libro, setLibro] = useState<Libro>('ventas');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data: ventasData, isLoading: loadingVentas } = useDocumentos(empresa?.id ?? '');
  const { data: comprasData, isLoading: loadingCompras } = useCompras(empresa?.id ?? '', anio, mes);

  const ventas = (ventasData?.data ?? []).filter((d) => {
    const fecha = new Date(d.fecha);
    return fecha.getFullYear() === anio && fecha.getMonth() + 1 === mes;
  });

  const compras = comprasData?.data ?? [];

  const totalNetoVentas = ventas.reduce((s, d) => s + Number(d.neto), 0);
  const totalIVAVentas = ventas.reduce((s, d) => s + Number(d.iva), 0);
  const totalVentas = ventas.reduce((s, d) => s + Number(d.total), 0);

  const totalNetoCompras = compras.reduce((s, c) => s + Number(c.neto), 0);
  const totalIVACompras = compras.reduce((s, c) => s + Number(c.iva), 0);
  const totalCompras = compras.reduce((s, c) => s + Number(c.total), 0);

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Libros IVA</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
      </div>

      {/* Filtro período */}
      <div className="flex items-center gap-3">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
      </div>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setLibro('ventas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${libro === 'ventas' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}
        >
          <FileText className="h-4 w-4" />Libro de Ventas
        </button>
        <button
          onClick={() => setLibro('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${libro === 'compras' ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'}`}
        >
          <ShoppingCart className="h-4 w-4" />Libro de Compras
        </button>
      </div>

      {/* LIBRO DE VENTAS */}
      {libro === 'ventas' && (
        loadingVentas ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !ventas.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin documentos en {MESES[mes-1]} {anio}</p>
          </CardContent></Card>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Folio</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Neto</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">IVA</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Total</th>
              </tr></thead>
              <tbody>
                {ventas.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3">
                      <Badge variant="outline" className="text-xs">{d.tipo.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-sm">#{d.folio}</td>
                    <td className="px-5 py-3 text-muted-foreground text-sm hidden md:table-cell">{new Date(d.fecha).toLocaleDateString('es-CL')}</td>
                    <td className="px-5 py-3 text-sm hidden sm:table-cell">{d.clienteId ?? '—'}</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(d.neto)}</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(d.iva)}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium">{clp(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-semibold">
                  <td colSpan={4} className="px-5 py-3">Totales — {ventas.length} documentos</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalNetoVentas)}</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalIVAVentas)}</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalVentas)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}

      {/* LIBRO DE COMPRAS */}
      {libro === 'compras' && (
        loadingCompras ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !compras.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin compras en {MESES[mes-1]} {anio}</p>
          </CardContent></Card>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Proveedor</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">RUT</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Folio</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Neto</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">IVA CF</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Total</th>
              </tr></thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{c.proveedorNombre}</td>
                    <td className="px-5 py-3 font-mono text-sm text-muted-foreground hidden sm:table-cell">{c.proveedorRut}</td>
                    <td className="px-5 py-3 font-mono text-sm">#{c.folio}</td>
                    <td className="px-5 py-3 text-muted-foreground text-sm hidden md:table-cell">{new Date(c.fecha).toLocaleDateString('es-CL')}</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(c.neto)}</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(c.iva)}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium">{clp(c.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-semibold">
                  <td colSpan={4} className="px-5 py-3">Totales — {compras.length} facturas</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalNetoCompras)}</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalIVACompras)}</td>
                  <td className="px-5 py-3 text-right font-mono">{clp(totalCompras)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      )}
    </div>
  );
}
