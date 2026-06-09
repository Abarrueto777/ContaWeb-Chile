import { useState } from 'react';
import { BarChart3, CalendarClock, Loader2, RefreshCw } from 'lucide-react';
import { useProPymeResumen, useProPymePpm, useSincronizarPpm, usePagarProPymePpm } from '@/hooks/usePropyme';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function clp(n: string | number) { return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }); }

type Vista = 'resumen' | 'ppm';

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold mt-1 ${accent ?? ''}`}>{value}</p></CardContent></Card>;
}

export default function ProPyme() {
  const now = new Date();
  const [vista, setVista] = useState<Vista>('resumen');
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState<number>(0); // 0 = anual

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const eid = empresa?.id ?? '';
  const { data: resData, isLoading: loadingRes } = useProPymeResumen(eid, anio, mes || null);
  const { data: ppmData } = useProPymePpm(eid, anio);
  const sincronizar = useSincronizarPpm(eid);
  const pagar = usePagarProPymePpm(eid);

  const r = resData?.data;
  const ppm = ppmData?.data;

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  async function onSincronizar() {
    const res = await sincronizar.mutateAsync(anio);
    alert(res.message);
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumen ProPyme D3</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} · Contabilidad Simplificada (Art. 14 D N°3 LIR)</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={vista === 'resumen' ? 'default' : 'outline'} size="sm" onClick={() => setVista('resumen')}><BarChart3 className="mr-1.5 h-3.5 w-3.5" />Resumen</Button>
          <Button variant={vista === 'ppm' ? 'default' : 'outline'} size="sm" onClick={() => setVista('ppm')}><CalendarClock className="mr-1.5 h-3.5 w-3.5" />Control PPM</Button>
          <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24 h-9" min={2000} max={now.getFullYear()} />
        </div>
      </div>

      {/* RESUMEN */}
      {vista === 'resumen' && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Período:</span>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="border rounded-md px-3 py-1.5 text-sm">
              <option value={0}>Anual (acumulado)</option>
              {MESES.map((m, i) => <option key={i + 1} value={i + 1}>Hasta {m}</option>)}
            </select>
          </div>
          {loadingRes || !r ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando…</div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <Kpi label="Total ingresos" value={clp(r.ingresos)} accent="text-blue-600" />
                <Kpi label="Total gastos" value={clp(r.gastos)} accent="text-amber-600" />
                <Kpi label="Renta líquida" value={clp(r.rentaLiquida)} accent={r.rentaLiquida >= 0 ? 'text-green-600' : 'text-red-600'} />
                <Kpi label={`Impuesto 1ª Cat (${(r.tasa1cat * 100).toFixed(0)}%)`} value={clp(r.impuesto1cat)} accent="text-red-600" />
                <Kpi label="PPM acumulado pagado" value={clp(r.ppmAcumulado)} accent="text-indigo-600" />
                <Kpi label={r.aPagar > 0 ? 'A pagar estimado' : 'A favor estimado'} value={clp(r.aPagar > 0 ? r.aPagar : r.aFavor)} accent={r.aPagar > 0 ? 'text-red-600' : 'text-green-600'} />
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="px-4 py-2 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Desglose {mes ? `· acumulado hasta ${MESES[mes - 1]}` : '· anual'} {anio}
                  </div>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b bg-blue-50/50"><td className="px-4 py-2 font-semibold">Ingresos (ventas y servicios)</td><td className="px-4 py-2 text-right font-mono">{clp(r.ingresos)}</td></tr>
                      <tr className="border-b bg-amber-50/50"><td className="px-4 py-2 font-semibold">Gastos del período</td><td className="px-4 py-2 text-right font-mono">{clp(r.gastos)}</td></tr>
                      <tr className="border-b"><td className="px-4 py-2 font-bold">Renta líquida (base imponible)</td><td className={`px-4 py-2 text-right font-mono font-bold ${r.rentaLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>{clp(r.rentaLiquida)}</td></tr>
                      <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">Impuesto 1ª Categoría ({(r.tasa1cat * 100).toFixed(0)}%)</td><td className="px-4 py-2 text-right font-mono">{clp(r.impuesto1cat)}</td></tr>
                      <tr className="border-b"><td className="px-4 py-2 text-muted-foreground">(−) PPM acumulado pagado ({(r.tasaPpm * 100).toFixed(2)}%)</td><td className="px-4 py-2 text-right font-mono">{clp(r.ppmAcumulado)}</td></tr>
                      <tr className={r.aPagar > 0 ? 'bg-red-50' : 'bg-green-50'}><td className="px-4 py-2 font-bold">{r.aPagar > 0 ? 'A PAGAR estimado' : 'A FAVOR estimado'}</td><td className={`px-4 py-2 text-right font-mono font-bold ${r.aPagar > 0 ? 'text-red-600' : 'text-green-600'}`}>{clp(r.aPagar > 0 ? r.aPagar : r.aFavor)}</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">Estimación orientativa sobre la contabilidad cargada. La renta líquida definitiva se determina en el F22.</p>
            </>
          )}
        </>
      )}

      {/* CONTROL PPM */}
      {vista === 'ppm' && (
        <>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={onSincronizar} disabled={sincronizar.isPending}>
              {sincronizar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Sincronizar desde documentos
            </Button>
            {ppm && <span className="text-xs text-muted-foreground ml-auto">PPM año: <strong>{clp(ppm.totalPpm)}</strong> · Pagado: <strong className="text-green-600">{clp(ppm.totalPagado)}</strong> · Pendiente: <strong className="text-amber-600">{clp(ppm.totalPendiente)}</strong></span>}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Mes</th>
                      <th className="px-4 py-2 text-right font-medium">Ingresos facturados</th>
                      <th className="px-4 py-2 text-right font-medium">Tasa</th>
                      <th className="px-4 py-2 text-right font-medium">PPM</th>
                      <th className="px-4 py-2 text-center font-medium">Estado</th>
                      <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Fecha pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MESES.map((m, i) => {
                      const mesNum = i + 1;
                      const reg = ppm?.registros.find((x) => x.mes === mesNum);
                      return (
                        <tr key={mesNum} className="border-b hover:bg-muted/10">
                          <td className="px-4 py-2 font-medium">{m}</td>
                          <td className="px-4 py-2 text-right font-mono">{reg ? clp(reg.ventasPeriodo) : '—'}</td>
                          <td className="px-4 py-2 text-right font-mono text-xs">{reg ? `${(Number(reg.ppmTasa) * 100).toFixed(2)}%` : '—'}</td>
                          <td className="px-4 py-2 text-right font-mono">{reg ? clp(reg.ppmMonto) : '—'}</td>
                          <td className="px-4 py-2 text-center">
                            {reg ? (
                              <button onClick={() => pagar.mutate({ id: reg.id, pagado: !reg.pagado })}>
                                <Badge variant={reg.pagado ? 'default' : 'secondary'} className="text-[10px] cursor-pointer">{reg.pagado ? 'Pagado' : 'Pendiente'}</Badge>
                              </button>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell text-muted-foreground text-xs">{reg?.fechaPago ? new Date(reg.fechaPago).toLocaleDateString('es-CL') : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">Sincronizar recalcula el PPM de cada mes con ventas (hasta el mes actual) tomando el neto de boletas y facturas emitidas. Hacé clic en el estado para marcar pagado/pendiente.</p>
        </>
      )}
    </div>
  );
}
