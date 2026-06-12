import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, TrendingUp, Plus, Trash2, Loader2, PlusCircle } from 'lucide-react';
import { asientoSchema, type AsientoInput } from '@contaweb/validations';
import { useLibroDiario, useLibroMayor, useBalance, useResultados, useBalance8 } from '@/hooks/useReportes';
import { useAsientos, useCreateAsiento } from '@/hooks/useAsientos';
import { usePlanCuentas } from '@/hooks/usePlanCuentas';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { TipoCuenta } from '@contaweb/shared-types';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
type ReporteTab = 'diario' | 'mayor' | 'balance' | 'resultados' | 'balance8' | 'asientos';

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
  const [openAsiento, setOpenAsiento] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const diario = useLibroDiario(empresa?.id ?? '', anio, mes);
  const mayor = useLibroMayor(empresa?.id ?? '', anio, mes);
  const balance = useBalance(empresa?.id ?? '', anio, mes);
  const resultados = useResultados(empresa?.id ?? '', anio, mes);
  const balance8 = useBalance8(empresa?.id ?? '', anio, mes);
  const asientos = useAsientos(empresa?.id ?? '', anio, mes);
  const { data: cuentasData } = usePlanCuentas(empresa?.id ?? '');
  const createAsiento = useCreateAsiento(empresa?.id ?? '');

  const cuentas = (cuentasData?.data ?? []).filter((c) => c.permiteMovimientos);

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<AsientoInput>({
    resolver: zodResolver(asientoSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0] as unknown as Date,
      glosa: '',
      lineas: [
        { cuentaId: '', debe: 0, haber: 0 },
        { cuentaId: '', debe: 0, haber: 0 },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lineas' });
  const lineas = watch('lineas');

  const totalDebe = lineas.reduce((s, l) => s + (Number(l.debe) || 0), 0);
  const totalHaber = lineas.reduce((s, l) => s + (Number(l.haber) || 0), 0);
  const diferencia = Math.abs(totalDebe - totalHaber);

  function onSubmitAsiento(d: AsientoInput) {
    createAsiento.mutate(d, {
      onSuccess: () => { reset(); setOpenAsiento(false); },
    });
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tienes empresas registradas</p>
    </div>
  );

  const tabs: { key: ReporteTab; label: string }[] = [
    { key: 'diario', label: 'Libro Diario' },
    { key: 'mayor', label: 'Libro Mayor' },
    { key: 'balance', label: 'Balance' },
    { key: 'balance8', label: 'Balance 8 Col.' },
    { key: 'resultados', label: 'Estado Resultados' },
    { key: 'asientos', label: 'Asientos Manuales' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contabilidad</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>
        {tab === 'asientos' && (
          <Dialog open={openAsiento} onOpenChange={(v) => { if (!v) { reset(); createAsiento.reset(); } setOpenAsiento(v); }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-4 w-4" />Nuevo asiento</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo asiento contable</DialogTitle>
              </DialogHeader>
              <form id="form-asiento" onSubmit={handleSubmit(onSubmitAsiento)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Fecha *</Label>
                    <Input {...register('fecha')} type="date" />
                    {errors.fecha && <p className="text-xs text-destructive">{errors.fecha.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Glosa *</Label>
                    <Input {...register('glosa')} placeholder="Descripción del asiento" />
                    {errors.glosa && <p className="text-xs text-destructive">{errors.glosa.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Líneas</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => append({ cuentaId: '', debe: 0, haber: 0 })}>
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" />Agregar línea
                    </Button>
                  </div>
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Cuenta</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">Debe</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">Haber</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, i) => (
                          <tr key={field.id} className="border-b last:border-0">
                            <td className="px-2 py-2">
                              <select {...register(`lineas.${i}.cuentaId`)} className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm">
                                <option value="">Seleccionar cuenta</option>
                                {cuentas.map((c) => (
                                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.debe`, { valueAsNumber: true })} type="number" min="0" step="any" className="h-8 text-sm w-28" />
                            </td>
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.haber`, { valueAsNumber: true })} type="number" min="0" step="any" className="h-8 text-sm w-28" />
                            </td>
                            <td className="px-2 py-2">
                              {fields.length > 2 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/50 border-t">
                          <td className="px-3 py-2 text-sm font-medium">Totales</td>
                          <td className="px-3 py-2 font-mono text-sm">{clp(totalDebe)}</td>
                          <td className="px-3 py-2 font-mono text-sm">{clp(totalHaber)}</td>
                          <td />
                        </tr>
                        {diferencia > 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-1.5 text-xs text-destructive">
                              El asiento no está cuadrado — diferencia: {clp(diferencia)}
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                  {errors.lineas && <p className="text-xs text-destructive">{errors.lineas.message ?? errors.lineas.root?.message}</p>}
                </div>

                {createAsiento.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createAsiento.error.message}</p>
                )}
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAsiento(false)} disabled={createAsiento.isPending}>Cancelar</Button>
                <Button type="submit" form="form-asiento" disabled={createAsiento.isPending || diferencia > 0.01}>
                  {createAsiento.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar asiento
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtro período */}
      <div className="flex items-center gap-3">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
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

      {/* BALANCE 8 COLUMNAS */}
      {tab === 'balance8' && (
        balance8.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        : !balance8.data?.data?.rows?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin movimientos para el período</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground" rowSpan={2}>Cuenta</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground border-l" colSpan={2}>Sumas del Mayor</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground border-l" colSpan={2}>Saldos</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground border-l" colSpan={2}>Balance General</th>
                    <th className="text-center px-3 py-2 font-medium text-muted-foreground border-l" colSpan={2}>Resultado</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l">Debe</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Haber</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l">Deudor</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Acreedor</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l">Activo</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Pasivo</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground border-l">Pérdida</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {balance8.data.data.rows.map((r) => (
                    <tr key={r.codigo} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-1.5"><span className="font-mono text-muted-foreground mr-1.5">{r.codigo}</span>{r.nombre}</td>
                      <td className="px-3 py-1.5 text-right font-mono border-l">{r.sumaDebe > 0 ? clp(r.sumaDebe) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.sumaHaber > 0 ? clp(r.sumaHaber) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono border-l">{r.saldoDeudor > 0 ? clp(r.saldoDeudor) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.saldoAcreedor > 0 ? clp(r.saldoAcreedor) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono border-l">{r.balanceActivo > 0 ? clp(r.balanceActivo) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.balancePasivo > 0 ? clp(r.balancePasivo) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono border-l">{r.debeResultado > 0 ? clp(r.debeResultado) : ''}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{r.haberResultado > 0 ? clp(r.haberResultado) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-semibold">
                    <td className="px-3 py-2">Totales</td>
                    <td className="px-3 py-2 text-right font-mono border-l">{clp(balance8.data.data.totales.sumaDebe)}</td>
                    <td className="px-3 py-2 text-right font-mono">{clp(balance8.data.data.totales.sumaHaber)}</td>
                    <td className="px-3 py-2 text-right font-mono border-l">{clp(balance8.data.data.totales.saldoDeudor)}</td>
                    <td className="px-3 py-2 text-right font-mono">{clp(balance8.data.data.totales.saldoAcreedor)}</td>
                    <td className="px-3 py-2 text-right font-mono border-l">{clp(balance8.data.data.totales.balanceActivo)}</td>
                    <td className="px-3 py-2 text-right font-mono">{clp(balance8.data.data.totales.balancePasivo)}</td>
                    <td className="px-3 py-2 text-right font-mono border-l">{clp(balance8.data.data.totales.debeResultado)}</td>
                    <td className="px-3 py-2 text-right font-mono">{clp(balance8.data.data.totales.haberResultado)}</td>
                  </tr>
                  <tr className="bg-muted/30">
                    <td colSpan={9} className="px-3 py-2 text-sm">
                      <span className="font-medium">{balance8.data.data.utilidad >= 0 ? 'Utilidad del período' : 'Pérdida del período'}: </span>
                      <span className={`font-mono font-bold ${balance8.data.data.utilidad >= 0 ? 'text-green-700' : 'text-destructive'}`}>
                        {clp(Math.abs(balance8.data.data.utilidad))}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
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

      {/* ASIENTOS MANUALES */}
      {tab === 'asientos' && (
        asientos.isLoading ? <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        : !asientos.data?.data?.length ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin asientos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Usa el botón "Nuevo asiento" para ingresar ajustes contables</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-3">
            {asientos.data.data.map((a) => (
              <div key={a.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-5 py-3 bg-muted/50 border-b flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-sm">Asiento #{a.numero}</span>
                    <span className="text-muted-foreground text-xs ml-3">{new Date(a.fecha).toLocaleDateString('es-CL')} — {a.glosa}</span>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {a.lineas.map((l) => (
                      <tr key={l.id} className="border-b last:border-0">
                        <td className="px-5 py-2"><span className="font-mono text-xs text-muted-foreground mr-2">{l.cuenta.codigo}</span>{l.cuenta.nombre}</td>
                        <td className="px-5 py-2 text-right font-mono">{Number(l.debe) > 0 ? clp(Number(l.debe)) : ''}</td>
                        <td className="px-5 py-2 text-right font-mono">{Number(l.haber) > 0 ? clp(Number(l.haber)) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
