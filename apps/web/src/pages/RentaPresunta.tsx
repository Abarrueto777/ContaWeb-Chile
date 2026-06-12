import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Tractor, Truck, Calculator, Trash2, Pencil, Loader2, Check } from 'lucide-react';
import { rpBienSchema, type RPBienInput } from '@contaweb/validations';
import type { RPBien, RPPpm } from '@contaweb/shared-types';
import {
  useRPBienes, useCreateRPBien, useUpdateRPBien, useDeleteRPBien,
  useRPPpm, useGuardarRPPpm, usePagarRPPpm, useRentaPresuntaCalculo,
} from '@/hooks/useRentaPresunta';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
function clp(n: string | number) { return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }); }

type Vista = 'bienes' | 'ppm' | 'calculo';

export default function RentaPresunta() {
  const now = new Date();
  const [vista, setVista] = useState<Vista>('bienes');
  const [anio, setAnio] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);
  const [editBien, setEditBien] = useState<RPBien | null>(null);
  const [regimen, setRegimen] = useState<'AGRICOLA' | 'TRANSPORTE'>('AGRICOLA');
  const [ventasMes, setVentasMes] = useState<Record<number, string>>({});

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const eid = empresa?.id ?? '';
  const { data: bienesData } = useRPBienes(eid);
  const createBien = useCreateRPBien(eid);
  const updateBien = useUpdateRPBien(eid);
  const deleteBien = useDeleteRPBien(eid);
  const { data: ppmData } = useRPPpm(eid, anio);
  const guardarPpm = useGuardarRPPpm(eid);
  const pagarPpm = usePagarRPPpm(eid);
  const { data: calcData, isLoading: loadingCalc } = useRentaPresuntaCalculo(eid, anio);

  const bienes = bienesData?.data ?? [];
  const ppm = ppmData?.data;
  const calc = calcData?.data;

  const form = useForm<RPBienInput>({ resolver: zodResolver(rpBienSchema), defaultValues: { tipo: 'AGRICOLA', avaluoFiscal: 0, valorTasacion: 0 } });
  const tipoWatch = form.watch('tipo');

  function abrirNuevo() { setEditBien(null); form.reset({ tipo: 'AGRICOLA', avaluoFiscal: 0, valorTasacion: 0 }); createBien.reset(); updateBien.reset(); setOpen(true); }
  function abrirEditar(b: RPBien) {
    setEditBien(b);
    form.reset({
      tipo: b.tipo, descripcion: b.descripcion,
      rolAvaluo: b.rolAvaluo, municipio: b.municipio, avaluoFiscal: Number(b.avaluoFiscal), anioAvaluo: b.anioAvaluo,
      patente: b.patente, tipoVehiculo: b.tipoVehiculo, marca: b.marca, modelo: b.modelo, anioVehiculo: b.anioVehiculo,
      valorTasacion: Number(b.valorTasacion), anioTasacion: b.anioTasacion,
    });
    setOpen(true);
  }
  function onSubmit(d: RPBienInput) {
    const onSuccess = () => { setOpen(false); setEditBien(null); };
    if (editBien) updateBien.mutate({ id: editBien.id, data: d }, { onSuccess });
    else createBien.mutate(d, { onSuccess });
  }

  function ppmDelMes(mes: number): RPPpm | undefined { return ppm?.registros.find((r) => r.mes === mes); }
  function guardarMes(mes: number) {
    const reg = ppmDelMes(mes);
    const ventas = Number(ventasMes[mes] ?? reg?.ventasPeriodo ?? 0);
    guardarPpm.mutate({ anio, mes, ventasPeriodo: ventas, tipo: regimen, pagado: reg?.pagado ?? false });
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tienes empresas registradas</p></div>;

  const tasaPpm = regimen === 'AGRICOLA' ? 0.0025 : 0.0030;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Renta Presunta</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} · Art. 20 N°1 b) y Art. 34 LIR</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={vista === 'bienes' ? 'default' : 'outline'} size="sm" onClick={() => setVista('bienes')}><Tractor className="mr-1.5 h-3.5 w-3.5" />Bienes</Button>
          <Button variant={vista === 'ppm' ? 'default' : 'outline'} size="sm" onClick={() => setVista('ppm')}><Truck className="mr-1.5 h-3.5 w-3.5" />PPM</Button>
          <Button variant={vista === 'calculo' ? 'default' : 'outline'} size="sm" onClick={() => setVista('calculo')}><Calculator className="mr-1.5 h-3.5 w-3.5" />Cálculo</Button>
          {vista !== 'bienes' && <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24 h-9" min={2000} max={now.getFullYear()} />}
        </div>
      </div>

      {/* BIENES */}
      {vista === 'bienes' && (
        <>
          <div className="flex justify-end"><Button size="sm" onClick={abrirNuevo}><Plus className="mr-1.5 h-3.5 w-3.5" />Nuevo bien</Button></div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Descripción</th>
                      <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Identificación</th>
                      <th className="px-4 py-2 text-right font-medium">Base (avalúo/tasación)</th>
                      <th className="px-4 py-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bienes.map((b) => (
                      <tr key={b.id} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2"><Badge variant={b.tipo === 'AGRICOLA' ? 'default' : 'secondary'} className="text-xs">{b.tipo === 'AGRICOLA' ? 'Agrícola' : 'Transporte'}</Badge></td>
                        <td className="px-4 py-2">{b.descripcion || '—'}</td>
                        <td className="px-4 py-2 hidden md:table-cell text-muted-foreground text-xs">{b.tipo === 'AGRICOLA' ? `Rol ${b.rolAvaluo ?? '—'} · ${b.municipio ?? ''}` : `${b.patente ?? '—'} · ${b.marca ?? ''} ${b.modelo ?? ''}`}</td>
                        <td className="px-4 py-2 text-right font-mono">{clp(b.tipo === 'AGRICOLA' ? b.avaluoFiscal : b.valorTasacion)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => abrirEditar(b)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Dar de baja este bien?')) deleteBien.mutate(b.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bienes.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin bienes registrados</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* PPM */}
      {vista === 'ppm' && (
        <>
          <div className="flex items-center gap-3">
            <Label className="text-xs">Régimen:</Label>
            <select value={regimen} onChange={(e) => setRegimen(e.target.value as 'AGRICOLA' | 'TRANSPORTE')} className="border rounded-md px-3 py-1.5 text-sm">
              <option value="AGRICOLA">Agrícola (0,25%)</option>
              <option value="TRANSPORTE">Transporte (0,30%)</option>
            </select>
            {ppm && <span className="text-xs text-muted-foreground ml-auto">PPM total: <strong>{clp(ppm.totalPpm)}</strong> · Pagado: <strong className="text-green-600">{clp(ppm.totalPagado)}</strong> · Pendiente: <strong className="text-amber-600">{clp(ppm.totalPendiente)}</strong></span>}
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Mes</th>
                      <th className="px-4 py-2 text-right font-medium">Ventas del período</th>
                      <th className="px-4 py-2 text-right font-medium">PPM ({(tasaPpm * 100).toFixed(2)}%)</th>
                      <th className="px-4 py-2 text-center font-medium">Estado</th>
                      <th className="px-4 py-2 text-right font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MESES.map((m, i) => {
                      const mes = i + 1;
                      const reg = ppmDelMes(mes);
                      const ventasStr = ventasMes[mes] ?? (reg ? String(Math.round(Number(reg.ventasPeriodo))) : '');
                      const ventas = Number(ventasStr) || 0;
                      const ppmCalc = Math.round(ventas * tasaPpm);
                      return (
                        <tr key={mes} className="border-b hover:bg-muted/10">
                          <td className="px-4 py-2 font-medium">{m}</td>
                          <td className="px-4 py-2 text-right">
                            <Input type="number" min={0} value={ventasStr} onChange={(e) => setVentasMes((v) => ({ ...v, [mes]: e.target.value }))} className="h-8 w-36 ml-auto text-right" placeholder="0" />
                          </td>
                          <td className="px-4 py-2 text-right font-mono">{ppmCalc > 0 ? clp(ppmCalc) : '—'}</td>
                          <td className="px-4 py-2 text-center">
                            {reg ? (
                              <button onClick={() => pagarPpm.mutate({ id: reg.id, pagado: !reg.pagado })}>
                                <Badge variant={reg.pagado ? 'default' : 'secondary'} className="text-[10px] cursor-pointer">{reg.pagado ? 'Pagado' : 'Pendiente'}</Badge>
                              </button>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => guardarMes(mes)} disabled={guardarPpm.isPending}>
                              <Check className="h-3 w-3 mr-1" />Guardar
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* CÁLCULO */}
      {vista === 'calculo' && (
        loadingCalc || !calc ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando…</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Renta presunta ({(calc.tasaPresuncion * 100).toFixed(0)}%)</p><p className="text-lg font-bold text-blue-600">{clp(calc.rentaPresunta)}</p></CardContent></Card>
              <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Impuesto 1ª Cat ({(calc.tasa1cat * 100).toFixed(0)}%)</p><p className="text-lg font-bold text-amber-600">{clp(calc.impuesto1cat)}</p></CardContent></Card>
              <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">PPM pagado</p><p className="text-lg font-bold text-green-600">{clp(calc.ppmPagado)}</p></CardContent></Card>
              <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">{calc.aPagar > 0 ? 'A pagar' : 'Saldo a favor'}</p><p className={`text-lg font-bold ${calc.aPagar > 0 ? 'text-red-600' : 'text-green-600'}`}>{clp(calc.aPagar > 0 ? calc.aPagar : calc.saldoFavor)}</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detalle por bien — AT {anio + 1} (renta {anio})</div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium">Descripción</th>
                      <th className="px-4 py-2 text-right font-medium">Base</th>
                      <th className="px-4 py-2 text-right font-medium">Renta presunta (10%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.detalle.map((d) => (
                      <tr key={d.id} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2"><Badge variant={d.tipo === 'AGRICOLA' ? 'default' : 'secondary'} className="text-[10px]">{d.tipo === 'AGRICOLA' ? 'Agrícola' : 'Transporte'}</Badge></td>
                        <td className="px-4 py-2">{d.descripcion}</td>
                        <td className="px-4 py-2 text-right font-mono">{clp(d.base)}</td>
                        <td className="px-4 py-2 text-right font-mono text-blue-600">{clp(d.rentaPresunta)}</td>
                      </tr>
                    ))}
                    {calc.detalle.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin bienes — registrá predios o vehículos en la pestaña Bienes</td></tr>}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30 font-semibold">
                      <td className="px-4 py-2" colSpan={2}>Total renta presunta</td>
                      <td className="px-4 py-2 text-right font-mono text-xs text-muted-foreground">Agro {clp(calc.baseAgricola)} · Transp {clp(calc.baseTransporte)}</td>
                      <td className="px-4 py-2 text-right font-mono text-blue-600">{clp(calc.rentaPresunta)}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </>
        )
      )}

      {/* Dialog Bien */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditBien(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editBien ? 'Editar bien' : 'Nuevo bien'}</DialogTitle>
            <DialogDescription>Predio agrícola (avalúo fiscal) o vehículo de transporte (tasación).</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div>
              <Label>Tipo de régimen</Label>
              <Controller control={form.control} name="tipo" render={({ field }) => (
                <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                  <option value="AGRICOLA">Agrícola (Art. 20 N°1 b)</option>
                  <option value="TRANSPORTE">Transporte (Art. 34)</option>
                </select>
              )} />
            </div>
            <div><Label>Descripción</Label><Input {...form.register('descripcion')} className="mt-1" placeholder={tipoWatch === 'AGRICOLA' ? 'Ej: Fundo El Roble' : 'Ej: Camión tolva'} /></div>

            {tipoWatch === 'AGRICOLA' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Rol de avalúo</Label><Input {...form.register('rolAvaluo')} className="mt-1" placeholder="123-45" /></div>
                  <div><Label>Comuna</Label><Input {...form.register('municipio')} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Avalúo fiscal $</Label><Input type="number" min={0} {...form.register('avaluoFiscal', { valueAsNumber: true })} className="mt-1" /></div>
                  <div><Label>Año avalúo</Label><Input type="number" {...form.register('anioAvaluo', { valueAsNumber: true })} className="mt-1" /></div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Patente</Label><Input {...form.register('patente')} className="mt-1" placeholder="ABCD12" /></div>
                  <div><Label>Tipo vehículo</Label><Input {...form.register('tipoVehiculo')} className="mt-1" placeholder="Camión" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Marca</Label><Input {...form.register('marca')} className="mt-1" /></div>
                  <div><Label>Modelo</Label><Input {...form.register('modelo')} className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor tasación $</Label><Input type="number" min={0} {...form.register('valorTasacion', { valueAsNumber: true })} className="mt-1" /></div>
                  <div><Label>Año tasación</Label><Input type="number" {...form.register('anioTasacion', { valueAsNumber: true })} className="mt-1" /></div>
                </div>
              </>
            )}
            {(createBien.error || updateBien.error) && <p className="text-xs text-red-500">{(createBien.error ?? updateBien.error)?.message}</p>}
            <DialogFooter>
              <Button type="submit" disabled={createBien.isPending || updateBien.isPending}>
                {(createBien.isPending || updateBien.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editBien ? 'Guardar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
