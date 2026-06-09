import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users, TrendingDown, ScrollText, Trash2, Pencil, Loader2, Download } from 'lucide-react';
import { socioSchema, retiroSchema, type SocioInput, type RetiroInput } from '@contaweb/validations';
import type { Socio, Retiro, DJ1886Socio } from '@contaweb/shared-types';
import {
  useSocios, useCreateSocio, useUpdateSocio, useDeleteSocio,
  useRetiros, useCreateRetiro, useUpdateRetiro, useDeleteRetiro,
  useDJ1886, descargarDJ1886Txt,
} from '@/hooks/useRetiros';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

const TIPO_SOCIO = ['SOCIO', 'DUEÑO', 'ACCIONISTA', 'EMPRESARIO INDIVIDUAL', 'COMUNERO'];
const TIPO_RENTA_LABEL: Record<string, string> = { AFECTA: 'Afecta a GC', EXENTA: 'Exenta', NO_RENTA: 'No renta' };
const TIPO_RENTA_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = { AFECTA: 'default', EXENTA: 'secondary', NO_RENTA: 'outline' };

type Vista = 'socios' | 'retiros' | 'dj1886';

export default function Retiros() {
  const now = new Date();
  const [vista, setVista] = useState<Vista>('socios');
  const [anio, setAnio] = useState(now.getFullYear());
  const [openSocio, setOpenSocio] = useState(false);
  const [editSocio, setEditSocio] = useState<Socio | null>(null);
  const [openRetiro, setOpenRetiro] = useState(false);
  const [editRetiro, setEditRetiro] = useState<Retiro | null>(null);
  const [descargando, setDescargando] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const eid = empresa?.id ?? '';

  const { data: sociosData } = useSocios(eid);
  const createSocio = useCreateSocio(eid);
  const updateSocio = useUpdateSocio(eid);
  const deleteSocio = useDeleteSocio(eid);
  const { data: retirosData } = useRetiros(eid, anio);
  const createRetiro = useCreateRetiro(eid);
  const updateRetiro = useUpdateRetiro(eid);
  const deleteRetiro = useDeleteRetiro(eid);
  const { data: djData, isLoading: loadingDj } = useDJ1886(eid, anio);

  const socios = sociosData?.data ?? [];
  const retiros = retirosData?.data ?? [];
  const dj = djData?.data;

  const formSocio = useForm<SocioInput>({ resolver: zodResolver(socioSchema), defaultValues: { tipo: 'SOCIO', porcentaje: 0 } });
  const formRetiro = useForm<RetiroInput>({ resolver: zodResolver(retiroSchema), defaultValues: { tipoRenta: 'AFECTA', factorIpc: 1 } });

  function abrirNuevoSocio() { setEditSocio(null); formSocio.reset({ tipo: 'SOCIO', porcentaje: 0 }); createSocio.reset(); updateSocio.reset(); setOpenSocio(true); }
  function abrirEditarSocio(s: Socio) {
    setEditSocio(s);
    formSocio.reset({ rut: s.rut, nombre: s.nombre, tipo: s.tipo, porcentaje: Number(s.porcentaje) });
    setOpenSocio(true);
  }
  function onSubmitSocio(d: SocioInput) {
    const onSuccess = () => { setOpenSocio(false); setEditSocio(null); };
    if (editSocio) updateSocio.mutate({ id: editSocio.id, data: d }, { onSuccess });
    else createSocio.mutate(d, { onSuccess });
  }

  function abrirNuevoRetiro() { setEditRetiro(null); formRetiro.reset({ tipoRenta: 'AFECTA', factorIpc: 1 }); createRetiro.reset(); updateRetiro.reset(); setOpenRetiro(true); }
  function abrirEditarRetiro(r: Retiro) {
    setEditRetiro(r);
    formRetiro.reset({
      socioId: r.socioId,
      fecha: r.fecha.slice(0, 10) as unknown as Date,
      monto: Number(r.monto),
      concepto: r.concepto ?? '',
      tipoRenta: r.tipoRenta,
      factorIpc: Number(r.factorIpc),
    });
    setOpenRetiro(true);
  }
  function onSubmitRetiro(d: RetiroInput) {
    const onSuccess = () => { setOpenRetiro(false); setEditRetiro(null); };
    if (editRetiro) updateRetiro.mutate({ id: editRetiro.id, data: d }, { onSuccess });
    else createRetiro.mutate(d, { onSuccess });
  }

  async function onDescargarTxt() {
    if (!empresa) return;
    setDescargando(true);
    try { await descargarDJ1886Txt(empresa.id, anio); }
    catch { alert('No hay retiros para descargar en el año seleccionado.'); }
    finally { setDescargando(false); }
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  const sumaPorcentaje = socios.reduce((s, x) => s + Number(x.porcentaje), 0);

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Retiros de Socios</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={vista === 'socios' ? 'default' : 'outline'} size="sm" onClick={() => setVista('socios')}>
            <Users className="mr-1.5 h-3.5 w-3.5" />Socios
          </Button>
          <Button variant={vista === 'retiros' ? 'default' : 'outline'} size="sm" onClick={() => setVista('retiros')}>
            <TrendingDown className="mr-1.5 h-3.5 w-3.5" />Retiros
          </Button>
          <Button variant={vista === 'dj1886' ? 'default' : 'outline'} size="sm" onClick={() => setVista('dj1886')}>
            <ScrollText className="mr-1.5 h-3.5 w-3.5" />DJ 1886
          </Button>
          {vista !== 'socios' && (
            <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24 h-9" min={2000} max={now.getFullYear()} />
          )}
        </div>
      </div>

      {/* SOCIOS */}
      {vista === 'socios' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Participación total: <strong className={sumaPorcentaje === 100 ? 'text-green-600' : 'text-amber-600'}>{sumaPorcentaje.toFixed(2)}%</strong>
              {sumaPorcentaje !== 100 && ' (debería sumar 100%)'}
            </p>
            <Button size="sm" onClick={abrirNuevoSocio}><Plus className="mr-1.5 h-3.5 w-3.5" />Nuevo socio</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">RUT</th>
                      <th className="px-4 py-2 text-left font-medium">Nombre</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium">% Participación</th>
                      <th className="px-4 py-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {socios.map((s) => (
                      <tr key={s.id} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2 font-mono text-xs">{s.rut}</td>
                        <td className="px-4 py-2 font-medium">{s.nombre}</td>
                        <td className="px-4 py-2"><Badge variant="secondary" className="text-xs">{s.tipo}</Badge></td>
                        <td className="px-4 py-2 text-right font-mono">{Number(s.porcentaje).toFixed(2)}%</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => abrirEditarSocio(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Dar de baja a este socio?')) deleteSocio.mutate(s.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {socios.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin socios registrados</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* RETIROS */}
      {vista === 'retiros' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Retiros del año {anio}</p>
            <Button size="sm" onClick={abrirNuevoRetiro} disabled={socios.length === 0}><Plus className="mr-1.5 h-3.5 w-3.5" />Nuevo retiro</Button>
          </div>
          {socios.length === 0 && <p className="text-xs text-amber-600">Registrá al menos un socio antes de cargar retiros.</p>}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium">Socio</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo renta</th>
                      <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Concepto</th>
                      <th className="px-4 py-2 text-right font-medium">Monto</th>
                      <th className="px-4 py-2 text-right font-medium hidden lg:table-cell">Factor</th>
                      <th className="px-4 py-2 text-right font-medium">Corregido</th>
                      <th className="px-4 py-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retiros.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/10">
                        <td className="px-4 py-2 text-muted-foreground">{new Date(r.fecha.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                        <td className="px-4 py-2 font-medium">{r.socio?.nombre ?? '—'}</td>
                        <td className="px-4 py-2"><Badge variant={TIPO_RENTA_VARIANT[r.tipoRenta]} className="text-[10px]">{TIPO_RENTA_LABEL[r.tipoRenta]}</Badge></td>
                        <td className="px-4 py-2 hidden md:table-cell text-muted-foreground">{r.concepto || '—'}</td>
                        <td className="px-4 py-2 text-right font-mono">{clp(r.monto)}</td>
                        <td className="px-4 py-2 text-right font-mono hidden lg:table-cell">{Number(r.factorIpc).toFixed(4)}</td>
                        <td className="px-4 py-2 text-right font-mono font-medium">{clp(r.montoCorregido)}</td>
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => abrirEditarRetiro(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Eliminar este retiro?')) deleteRetiro.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {retiros.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin retiros en {anio}</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* DJ 1886 */}
      {vista === 'dj1886' && (
        <>
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 flex items-center justify-between gap-3">
            <span>
              DJ 1886 · AT {anio + 1} (año {anio}) · Tasa 1ª Cat: <strong>{((dj?.tasa1cat ?? 0.25) * 100).toFixed(0)}%</strong>.
              Incremento por IDPC = afecta × tasa/(1−tasa). Declarar en sii.cl → Declaraciones Juradas → 1886.
            </span>
            <Button size="sm" onClick={onDescargarTxt} disabled={descargando || !dj || dj.socios.every(s => s.totalCorregido === 0)}>
              {descargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}TXT
            </Button>
          </div>
          {loadingDj ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculando…</div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                        <th className="px-3 py-2 text-center font-medium">N°</th>
                        <th className="px-3 py-2 text-left font-medium">RUT</th>
                        <th className="px-3 py-2 text-left font-medium">Socio</th>
                        <th className="px-3 py-2 text-right font-medium">Afecta GC</th>
                        <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Exenta</th>
                        <th className="px-3 py-2 text-right font-medium hidden md:table-cell">No renta</th>
                        <th className="px-3 py-2 text-right font-medium">Incremento</th>
                        <th className="px-3 py-2 text-right font-medium">Crédito IDPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dj?.socios ?? []).map((f: DJ1886Socio) => (
                        <tr key={f.nro} className="border-b hover:bg-muted/10">
                          <td className="px-3 py-2 text-center text-muted-foreground">{f.nro}</td>
                          <td className="px-3 py-2 font-mono text-xs">{f.rut}</td>
                          <td className="px-3 py-2">{f.nombre}</td>
                          <td className="px-3 py-2 text-right font-mono">{clp(f.afecta)}</td>
                          <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(f.exenta)}</td>
                          <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(f.noRenta)}</td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600">{clp(f.incremento)}</td>
                          <td className="px-3 py-2 text-right font-mono text-green-600">{clp(f.credito)}</td>
                        </tr>
                      ))}
                      {(dj?.socios ?? []).length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin socios activos</td></tr>}
                    </tbody>
                    {dj && dj.socios.length > 0 && (
                      <tfoot>
                        <tr className="border-t bg-muted/30 font-semibold">
                          <td className="px-3 py-2" colSpan={3}>Totales</td>
                          <td className="px-3 py-2 text-right font-mono">{clp(dj.totales.afecta)}</td>
                          <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(dj.totales.exenta)}</td>
                          <td className="px-3 py-2 text-right font-mono hidden md:table-cell">{clp(dj.totales.noRenta)}</td>
                          <td className="px-3 py-2 text-right font-mono text-blue-600">{clp(dj.totales.incremento)}</td>
                          <td className="px-3 py-2 text-right font-mono text-green-600">{clp(dj.totales.credito)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog Socio */}
      <Dialog open={openSocio} onOpenChange={(o) => { setOpenSocio(o); if (!o) setEditSocio(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editSocio ? 'Editar socio' : 'Nuevo socio'}</DialogTitle>
            <DialogDescription>Datos del socio o dueño y su participación.</DialogDescription>
          </DialogHeader>
          <form onSubmit={formSocio.handleSubmit(onSubmitSocio)} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>RUT</Label><Input {...formSocio.register('rut')} className="mt-1" placeholder="12.345.678-9" />{formSocio.formState.errors.rut && <p className="text-xs text-red-500 mt-1">{formSocio.formState.errors.rut.message}</p>}</div>
              <div><Label>% Participación</Label><Input type="number" step="0.01" min={0} max={100} {...formSocio.register('porcentaje', { valueAsNumber: true })} className="mt-1" /></div>
            </div>
            <div><Label>Nombre</Label><Input {...formSocio.register('nombre')} className="mt-1" placeholder="Nombre completo" />{formSocio.formState.errors.nombre && <p className="text-xs text-red-500 mt-1">{formSocio.formState.errors.nombre.message}</p>}</div>
            <div>
              <Label>Tipo</Label>
              <Controller control={formSocio.control} name="tipo" render={({ field }) => (
                <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                  {TIPO_SOCIO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )} />
            </div>
            {(createSocio.error || updateSocio.error) && <p className="text-xs text-red-500">{(createSocio.error ?? updateSocio.error)?.message}</p>}
            <DialogFooter>
              <Button type="submit" disabled={createSocio.isPending || updateSocio.isPending}>
                {(createSocio.isPending || updateSocio.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editSocio ? 'Guardar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Retiro */}
      <Dialog open={openRetiro} onOpenChange={(o) => { setOpenRetiro(o); if (!o) setEditRetiro(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editRetiro ? 'Editar retiro' : 'Nuevo retiro'}</DialogTitle>
            <DialogDescription>Retiro, remesa o distribución a un socio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={formRetiro.handleSubmit(onSubmitRetiro)} className="space-y-4 pt-2">
            <div>
              <Label>Socio</Label>
              <Controller control={formRetiro.control} name="socioId" render={({ field }) => (
                <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                  <option value="">Seleccionar socio…</option>
                  {socios.map(s => <option key={s.id} value={s.id}>{s.nombre} — {s.rut}</option>)}
                </select>
              )} />
              {formRetiro.formState.errors.socioId && <p className="text-xs text-red-500 mt-1">{formRetiro.formState.errors.socioId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha</Label>
                <Controller control={formRetiro.control} name="fecha" render={({ field }) => (
                  <Input type="date" className="mt-1" value={field.value ? String(field.value).slice(0, 10) : ''} onChange={e => field.onChange(e.target.value)} />
                )} />
                {formRetiro.formState.errors.fecha && <p className="text-xs text-red-500 mt-1">Requerida</p>}
              </div>
              <div><Label>Monto</Label><Input type="number" min={0} step={1} {...formRetiro.register('monto', { valueAsNumber: true })} className="mt-1" />{formRetiro.formState.errors.monto && <p className="text-xs text-red-500 mt-1">{formRetiro.formState.errors.monto.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de renta</Label>
                <Controller control={formRetiro.control} name="tipoRenta" render={({ field }) => (
                  <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                    {Object.entries(TIPO_RENTA_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                )} />
              </div>
              <div><Label>Factor IPC</Label><Input type="number" step="0.0001" min={0} {...formRetiro.register('factorIpc', { valueAsNumber: true })} className="mt-1" /></div>
            </div>
            <div><Label>Concepto (opcional)</Label><Input {...formRetiro.register('concepto')} className="mt-1" placeholder="Ej: retiro mensual" /></div>
            {(createRetiro.error || updateRetiro.error) && <p className="text-xs text-red-500">{(createRetiro.error ?? updateRetiro.error)?.message}</p>}
            <DialogFooter>
              <Button type="submit" disabled={createRetiro.isPending || updateRetiro.isPending}>
                {(createRetiro.isPending || updateRetiro.isPending) ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editRetiro ? 'Guardar' : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
