import { useState } from 'react';
import { BookOpen, TrendingUp } from 'lucide-react';
import { useLibroDiario, useLibroMayor, useBalance, useResultados } from '@/hooks/useReportes';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TipoCuenta } from '@contaweb/shared-types';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
type ReporteTab = 'diario' | 'mayor' | 'balance' | 'resultados';

function clp(n: number) {
  return n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

const TIPO_COLORS: Record<TipoCuenta, string> = {
  ACTIVO: 'bg-blue-50 text-blue-700',
  PASIVO: 'bg-orange-50 text-orange-700',
  PATRIMONIO: 'bg-purple-50 text-purple-700',
  INGRESO: 'bg-green-50 text-green-700',
  GASTO: 'bg-red-50 text-red-700',
};

export default function Contabilidad() {
  const hoy = new Date();
  const [tab, setTab] = useState<ReporteTab>('diario');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const diario = useLibroDiario(empresa?.id ?? '', anio, mes);
  const mayor = useLibroMayor(empresa?.id ?? '', anio, mes);
  const balance = useBalance(empresa?.id ?? '', anio, mes);
  const resultados = useResultados(empresa?.id ?? '', anio, mes);

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  const tabs: { key: ReporteTab; label: string }[] = [
    { key: 'diario', label: 'Libro Diario' },
    { key: 'mayor', label: 'Libro Mayor' },
    { key: 'balance', label: 'Balance General' },
    { key: 'resultados', label: 'Estado de Resultados' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
      </div>

      {/* Filtro período */}
      <div className="flex items-center gap-3">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LIBRO DIARIO */}
      {tab === 'diario' && (
        diario.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !diario.data?.data?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin asientos en este período</p>
          </CardContent></Card>
        ) : (
          <>
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground w-24">Fecha</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground w-16">N°</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Glosa</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cuenta</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Debe</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Haber</th>
                </tr></thead>
                <tbody>
                  {diario.data.data.map((e, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-5 py-2 text-muted-foreground text-xs">{new Date(e.fecha).toLocaleDateString('es-CL')}</td>
                      <td className="px-5 py-2 text-muted-foreground text-xs font-mono">{e.numero}</td>
                      <td className="px-5 py-2 text-muted-foreground text-xs hidden sm:table-cell">{e.glosa}</td>
                      <td className="px-5 py-2"><span className="font-mono text-xs text-muted-foreground mr-2">{e.cuentaCodigo}</span>{e.cuentaNombre}</td>
                      <td className="px-5 py-2 text-right font-mono">{e.debe > 0 ? clp(e.debe) : ''}</td>
                      <td className="px-5 py-2 text-right font-mono">{e.haber > 0 ? clp(e.haber) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 border-t font-semibold">
                    <td colSpan={4} className="px-5 py-3 text-sm">Totales</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(diario.data.data.reduce((s, e) => s + e.debe, 0))}</td>
                    <td className="px-5 py-3 text-right font-mono">{clp(diario.data.data.reduce((s, e) => s + e.haber, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )
      )}

      {/* LIBRO MAYOR */}
      {tab === 'mayor' && (
        mayor.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
        : !mayor.data?.data?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin movimientos en este período</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {mayor.data.data.map((cuenta) => (
              <div key={cuenta.cuentaCodigo} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-5 py-3 bg-muted/50 border-b flex items-center justify-between">
                  <p className="font-semibold"><span className="font-mono text-muted-foreground mr-2">{cuenta.cuentaCodigo}</span>{cuenta.cuentaNombre}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Debe: <span className="font-mono font-medium">{clp(cuenta.totalDebe)}</span></span>
                    <span className="text-muted-foreground">Haber: <span className="font-mono font-medium">{clp(cuenta.totalHaber)}</span></span>
                    <span className="font-semibold">Saldo: <span className="font-mono">{clp(cuenta.saldoFinal)}</span></span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {cuenta.movimientos.map((m, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-5 py-2 text-muted-foreground text-xs w-24">{new Date(m.fecha).toLocaleDateString('es-CL')}</td>
                        <td className="px-5 py-2 text-muted-foreground text-xs">{m.glosa}</td>
                        <td className="px-5 py-2 text-right font-mono">{m.debe > 0 ? clp(m.debe) : ''}</td>
                        <td className="px-5 py-2 text-right font-mono">{m.haber > 0 ? clp(m.haber) : ''}</td>
                        <td className="px-5 py-2 text-right font-mono font-medium">{clp(m.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}

      {/* BALANCE GENERAL */}
      {tab === 'balance' && (
        balance.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !balance.data?.data?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin saldos registrados</p>
          </CardContent></Card>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Código</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Saldo</th>
              </tr></thead>
              <tbody>
                {balance.data.data.map((e) => (
                  <tr key={e.codigo} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3"><Badge className={`text-xs ${TIPO_COLORS[e.tipo as TipoCuenta]}`}>{e.tipo}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{e.codigo}</td>
                    <td className="px-5 py-3" style={{ paddingLeft: `${20 + (e.nivel - 1) * 12}px` }}>{e.nombre}</td>
                    <td className="px-5 py-3 text-right font-mono font-medium">{clp(e.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ESTADO DE RESULTADOS */}
      {tab === 'resultados' && (
        resultados.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !resultados.data?.data ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin datos para el período</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {/* Ingresos */}
            <Card>
              <CardContent className="pt-5">
                <p className="font-semibold text-green-700 mb-3">Ingresos</p>
                <table className="w-full text-sm">
                  <tbody>
                    {resultados.data.data.ingresos.map((e) => (
                      <tr key={e.codigo} className="border-b last:border-0">
                        <td className="py-1.5 text-muted-foreground font-mono text-xs">{e.codigo}</td>
                        <td className="py-1.5">{e.nombre}</td>
                        <td className="py-1.5 text-right font-mono text-green-700">{clp(e.saldo)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t">
                      <td colSpan={2} className="py-2">Total Ingresos</td>
                      <td className="py-2 text-right font-mono text-green-700">{clp(resultados.data.data.totalIngresos)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Gastos */}
            <Card>
              <CardContent className="pt-5">
                <p className="font-semibold text-red-700 mb-3">Gastos y Costos</p>
                <table className="w-full text-sm">
                  <tbody>
                    {resultados.data.data.gastos.map((e) => (
                      <tr key={e.codigo} className="border-b last:border-0">
                        <td className="py-1.5 text-muted-foreground font-mono text-xs">{e.codigo}</td>
                        <td className="py-1.5">{e.nombre}</td>
                        <td className="py-1.5 text-right font-mono text-red-700">{clp(e.saldo)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold border-t">
                      <td colSpan={2} className="py-2">Total Gastos</td>
                      <td className="py-2 text-right font-mono text-red-700">{clp(resultados.data.data.totalGastos)}</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card className={resultados.data.data.utilidadNeta >= 0 ? 'border-green-200 bg-green-50/50' : 'border-destructive/30 bg-destructive/5'}>
              <CardContent className="pt-5 flex items-center justify-between">
                <p className="font-bold text-lg">{resultados.data.data.utilidadNeta >= 0 ? 'Utilidad del Ejercicio' : 'Pérdida del Ejercicio'}</p>
                <p className={`text-2xl font-bold font-mono ${resultados.data.data.utilidadNeta >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                  {clp(Math.abs(resultados.data.data.utilidadNeta))}
                </p>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
}
