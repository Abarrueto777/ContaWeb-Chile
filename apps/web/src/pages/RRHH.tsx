import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users, FileText, Trash2, Loader2, CheckCircle, Pencil, Download, Printer, Briefcase, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import { trabajadorSchema, liquidacionInputSchema, finiquitoInputSchema, CAUSALES_FINIQUITO, type TrabajadorInput, type LiquidacionInput, type FiniquitoInput } from '@contaweb/validations';
import type { Trabajador, Liquidacion } from '@contaweb/shared-types';
import { useTrabajadores, useCreateTrabajador, useUpdateTrabajador, useDesactivarTrabajador, useReactivarTrabajador } from '@/hooks/useTrabajadores';
import { useLiquidaciones, useCreateLiquidacion, useDeleteLiquidacion, usePagarLiquidacion } from '@/hooks/useLiquidaciones';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const CAUSAL_LABELS: Record<string, string> = {
  '159_N1': 'Art. 159 N°1 — Mutuo acuerdo',
  '159_N2': 'Art. 159 N°2 — Renuncia voluntaria',
  '159_N3': 'Art. 159 N°3 — Muerte del trabajador',
  '159_N4': 'Art. 159 N°4 — Vencimiento del plazo',
  '160_N1': 'Art. 160 N°1 — Falta de probidad',
  '160_N3': 'Art. 160 N°3 — No concurrencia injustificada',
  '160_N4': 'Art. 160 N°4 — Abandono de trabajo',
  '160_N7': 'Art. 160 N°7 — Incumplimiento grave del contrato',
  '161_NECESIDADES': 'Art. 161 — Necesidades de la empresa (con indemnización)',
  '161_DESAHUCIO': 'Art. 161 — Desahucio (con indemnización)',
};
const AFP_OPTIONS = ['CAPITAL','CUPRUM','HABITAT','PLANVITAL','PROVIDA','MODELO','UNO'];
const SALUD_OPTIONS = [
  { value: 'FONASA', label: 'FONASA' },
  { value: 'BANMEDICA', label: 'Bánmédica (ISAPRE)' },
  { value: 'COLMENA', label: 'Colmena (ISAPRE)' },
  { value: 'CRUZ_BLANCA', label: 'Cruz Blanca (ISAPRE)' },
  { value: 'NUEVA_MASVIDA', label: 'Nueva Masvida (ISAPRE)' },
  { value: 'VIDA_TRES', label: 'Vida Tres (ISAPRE)' },
  { value: 'CONSALUD', label: 'Consalud (ISAPRE)' },
  { value: 'ESENCIAL', label: 'Esencial (ISAPRE)' },
];

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

type Vista = 'trabajadores' | 'liquidaciones';

export default function RRHH() {
  const hoy = new Date();
  const [vista, setVista] = useState<Vista>('trabajadores');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [openTrabajador, setOpenTrabajador] = useState(false);
  const [openLiq, setOpenLiq] = useState(false);
  const [openFiniquito, setOpenFiniquito] = useState(false);
  const [editando, setEditando] = useState<Trabajador | null>(null);
  const [finiquitandoTrab, setFiniquitandoTrab] = useState<Trabajador | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos');

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data: trabData, isLoading: loadingTrab } = useTrabajadores(empresa?.id ?? '');
  const { data: liqData, isLoading: loadingLiq } = useLiquidaciones(empresa?.id ?? '', anio, mes);
  const createTrab = useCreateTrabajador(empresa?.id ?? '');
  const updateTrab = useUpdateTrabajador(empresa?.id ?? '', editando?.id ?? '');
  const desactivar = useDesactivarTrabajador(empresa?.id ?? '');
  const reactivar = useReactivarTrabajador(empresa?.id ?? '');
  const createLiq = useCreateLiquidacion(empresa?.id ?? '');
  const deleteLiq = useDeleteLiquidacion(empresa?.id ?? '');
  const pagarLiq = usePagarLiquidacion(empresa?.id ?? '');

  const todosLosTrabajadores = trabData?.data ?? [];
  const trabajadores = todosLosTrabajadores.filter((t) =>
    filtroActivo === 'todos' ? true : filtroActivo === 'activos' ? t.activo : !t.activo
  );
  const liquidaciones = liqData?.data ?? [];

  const formTrab = useForm<TrabajadorInput>({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: { tipo: 'DEPENDIENTE', afp: 'HABITAT', salud: 'FONASA', pctSalud: 0.07, tieneCes: false, tipoGratificacion: 'ART_50', tieneMovilizacion: false, tieneColacion: false, jornadaHoras: 42, tipoContrato: 'INDEFINIDO' },
  });

  const formLiq = useForm<LiquidacionInput>({
    resolver: zodResolver(liquidacionInputSchema),
    defaultValues: { anio, mes, horasExtra: 0, bono: 0, diasTrabajados: 30, anticipo: 0, utm: 68400, imm: 539000 },
  });

  const formFiniquito = useForm<FiniquitoInput>({
    resolver: zodResolver(finiquitoInputSchema),
    defaultValues: { causal: '159_N1', diasVacaciones: 0, avisoPrevioOtorgado: true, otrosDescuentos: 0 },
  });

  function onSubmitTrab(d: TrabajadorInput) {
    const mutation = editando ? updateTrab : createTrab;
    mutation.mutate(d, {
      onSuccess: () => { formTrab.reset(); mutation.reset(); setOpenTrabajador(false); setEditando(null); },
    });
  }

  function onSubmitLiq(d: LiquidacionInput) {
    createLiq.mutate(d, { onSuccess: () => { formLiq.reset(); createLiq.reset(); setOpenLiq(false); } });
  }

  async function abrirContrato(t: Trabajador) {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/trabajadores/${t.id}/contrato`, { responseType: 'text' });
    const blob = new Blob([res.data as string], { type: 'text/html; charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function abrirPdfLiquidacion(l: Liquidacion) {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/liquidaciones/${l.id}/pdf`, { responseType: 'text' });
    const blob = new Blob([res.data as string], { type: 'text/html; charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function onSubmitFiniquito(d: FiniquitoInput) {
    if (!empresa || !finiquitandoTrab) return;
    const res = await api.post(`/api/empresas/${empresa.id}/trabajadores/${finiquitandoTrab.id}/finiquito`, d);
    const finiquitoId = (res.data as { data: { id: string } }).data.id;
    const htmlRes = await api.get(`/api/empresas/${empresa.id}/trabajadores/${finiquitandoTrab.id}/finiquito/${finiquitoId}`, { responseType: 'text' });
    const blob = new Blob([htmlRes.data as string], { type: 'text/html; charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
    desactivar.mutate(finiquitandoTrab.id);
    formFiniquito.reset();
    setOpenFiniquito(false);
    setFiniquitandoTrab(null);
  }

  function abrirLibroRemuneraciones() {
    const mesLabel = MESES[mes - 1];
    const clpF = (n: number) => Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
    type LiqExt = typeof liquidaciones[0] & { sueldoBase?: number; horasExtra?: number; bono?: number; gratificacion?: number; movilizacion?: number; colacion?: number; anticipo?: number; cotizSis?: number };
    const filas = (liquidaciones as LiqExt[]).map((l, i) => `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:6px 8px;text-align:center;font-size:9pt;">${i + 1}</td>
        <td style="padding:6px 8px;font-size:9pt;">${l.trabajador?.nombre ?? '—'}</td>
        <td style="padding:6px 8px;font-size:9pt;">${l.trabajador?.rut ?? '—'}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.sueldoBase ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.horasExtra ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.bono ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.gratificacion ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.movilizacion ?? 0) + Number(l.colacion ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;font-weight:600;">${clpF(Number(l.imponible))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.cotizAfp))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.cotizSalud))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.cotizCes ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;">${clpF(Number(l.impuestoUnico ?? 0))}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;font-size:9pt;font-weight:700;color:#166534;">${clpF(Number(l.liquido))}</td>
        <td style="padding:6px 8px;text-align:center;font-size:8pt;color:#6b7280;">____________</td>
      </tr>`).join('');

    const totales = (liquidaciones as LiqExt[]).reduce((acc, l) => ({
      imponible: acc.imponible + Number(l.imponible),
      cotizAfp: acc.cotizAfp + Number(l.cotizAfp),
      cotizSalud: acc.cotizSalud + Number(l.cotizSalud),
      cotizCes: acc.cotizCes + Number(l.cotizCes ?? 0),
      impuesto: acc.impuesto + Number(l.impuestoUnico ?? 0),
      liquido: acc.liquido + Number(l.liquido),
    }), { imponible: 0, cotizAfp: 0, cotizSalud: 0, cotizCes: 0, impuesto: 0, liquido: 0 });

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
    <title>Libro de Remuneraciones — ${mesLabel} ${anio}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10pt;padding:16px 20px}
    h1{font-size:13pt;text-align:center;text-transform:uppercase;margin-bottom:4px}
    .sub{text-align:center;font-size:9.5pt;color:#555;margin-bottom:14px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#f3f4f6}
    th{padding:6px 8px;font-size:8.5pt;font-weight:600;text-align:right;border:1px solid #d1d5db}
    th:first-child,th:nth-child(2),th:nth-child(3){text-align:left}
    td{border:1px solid #e5e7eb}
    .total-row td{background:#f9fafb;font-weight:700;font-size:9pt}
    @media print{body{padding:8mm 12mm}}</style></head>
    <body>
    <h1>${empresa?.razonSocial ?? ''} — Libro de Remuneraciones</h1>
    <p class="sub">Período: ${mesLabel} ${anio} &nbsp;·&nbsp; RUT: ${empresa?.rut ?? ''} &nbsp;·&nbsp; ${liquidaciones.length} trabajador(es)</p>
    <table>
      <thead><tr>
        <th style="text-align:center">N°</th>
        <th>Trabajador</th><th>RUT</th>
        <th>Sueldo Base</th><th>H. Extra</th><th>Bono</th><th>Gratificación</th><th>Mov+Col</th>
        <th>Imponible</th><th>AFP</th><th>Salud</th><th>CES</th><th>Imp. Único</th>
        <th>Líquido</th><th style="text-align:center">Firma</th>
      </tr></thead>
      <tbody>${filas}</tbody>
      <tfoot><tr class="total-row">
        <td colspan="8" style="padding:6px 8px;text-align:right;border:1px solid #d1d5db;">TOTALES</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;border:1px solid #d1d5db;">${clpF(totales.imponible)}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;border:1px solid #d1d5db;">${clpF(totales.cotizAfp)}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;border:1px solid #d1d5db;">${clpF(totales.cotizSalud)}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;border:1px solid #d1d5db;">${clpF(totales.cotizCes)}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;border:1px solid #d1d5db;">${clpF(totales.impuesto)}</td>
        <td style="padding:6px 8px;text-align:right;font-family:monospace;color:#166534;border:1px solid #d1d5db;">${clpF(totales.liquido)}</td>
        <td style="border:1px solid #d1d5db;"></td>
      </tr></tfoot>
    </table>
    <div style="margin-top:30px;display:flex;justify-content:space-around;">
      <div style="text-align:center"><div style="border-top:1px solid #333;width:200px;padding-top:4px;font-size:9pt;">Empleador / Representante Legal</div></div>
      <div style="text-align:center"><div style="border-top:1px solid #333;width:200px;padding-top:4px;font-size:9pt;">Contador / Responsable</div></div>
    </div>
    </body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function descargarLRE() {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/liquidaciones/lre`, {
      params: { anio, mes },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LRE_${empresa.rut}_${anio}_${String(mes).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function abrirEditar(t: Trabajador) {
    setEditando(t);
    formTrab.reset({
      rut: t.rut, nombre: t.nombre, cargo: t.cargo ?? '',
      ...(t.email ? { email: t.email } : {}),
      ...(t.domicilio ? { domicilio: t.domicilio } : {}),
      ...(t.fechaNacimiento ? { fechaNacimiento: new Date(t.fechaNacimiento) } : {}),
      ...(t.estadoCivil ? { estadoCivil: t.estadoCivil as TrabajadorInput['estadoCivil'] } : {}),
      ...(t.nacionalidad ? { nacionalidad: t.nacionalidad } : {}),
      ...(t.region ? { region: t.region } : {}),
      ...(t.comuna ? { comuna: t.comuna } : {}),
      tipo: t.tipo, sueldoBase: Number(t.sueldoBase),
      afp: t.afp, salud: t.salud, pctSalud: Number(t.pctSalud),
      ...(t.montoIsapre ? { montoIsapre: Number(t.montoIsapre) } : {}),
      tieneCes: t.tieneCes, tipoGratificacion: t.tipoGratificacion,
      tieneMovilizacion: t.tieneMovilizacion, tieneColacion: t.tieneColacion,
      montoMovilizacion: t.montoMovilizacion ? Number(t.montoMovilizacion) : undefined,
      montoColacion: t.montoColacion ? Number(t.montoColacion) : undefined,
      jornadaHoras: t.jornadaHoras, tipoContrato: t.tipoContrato, fechaIngreso: new Date(t.fechaIngreso),
    });
    setOpenTrabajador(true);
  }

  const totalLiquido = liquidaciones.reduce((s, l) => s + Number(l.liquido), 0);
  const totalCosto = liquidaciones.reduce((s, l) => s + Number(l.costoEmpleador), 0);

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RRHH — Remuneraciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={vista === 'trabajadores' ? 'default' : 'outline'} size="sm" onClick={() => setVista('trabajadores')}>
            <Users className="mr-1.5 h-3.5 w-3.5" />Trabajadores
          </Button>
          <Button variant={vista === 'liquidaciones' ? 'default' : 'outline'} size="sm" onClick={() => setVista('liquidaciones')}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />Liquidaciones
          </Button>
        </div>
      </div>

      {/* VISTA TRABAJADORES */}
      {vista === 'trabajadores' && (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
              {(['activos', 'inactivos', 'todos'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroActivo(f)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filtroActivo === f ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {f === 'activos' ? 'Activos' : f === 'inactivos' ? 'Inactivos' : 'Todos'}
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {f === 'activos' ? todosLosTrabajadores.filter(t => t.activo).length
                      : f === 'inactivos' ? todosLosTrabajadores.filter(t => !t.activo).length
                      : todosLosTrabajadores.length}
                  </span>
                </button>
              ))}
            </div>
            <Dialog open={openTrabajador} onOpenChange={(v) => { if (!v) { formTrab.reset(); createTrab.reset(); setEditando(null); } setOpenTrabajador(v); }}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo trabajador</Button></DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editando ? 'Editar trabajador' : 'Nuevo trabajador'}</DialogTitle>
                  <DialogDescription>Datos del contrato y previsión.</DialogDescription>
                </DialogHeader>
                <form id="form-trab" onSubmit={formTrab.handleSubmit(onSubmitTrab)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>RUT *</Label><Input {...formTrab.register('rut')} placeholder="12.345.678-9" />{formTrab.formState.errors.rut && <p className="text-xs text-destructive">{formTrab.formState.errors.rut.message}</p>}</div>
                    <div className="space-y-1.5"><Label>Nombre *</Label><Input {...formTrab.register('nombre')} placeholder="Juan Pérez" /></div>
                    <div className="space-y-1.5 sm:col-span-2"><Label>Correo electrónico</Label><Input {...formTrab.register('email')} type="email" placeholder="juan@empresa.cl" /></div>
                  </div>
                  <div className="border-t pt-3 space-y-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Datos personales</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2"><Label>Domicilio *</Label><Input {...formTrab.register('domicilio')} placeholder="Av. Ejemplo 123, Santiago" />{formTrab.formState.errors.domicilio && <p className="text-xs text-destructive">{formTrab.formState.errors.domicilio.message}</p>}</div>
                      <div className="space-y-1.5"><Label>Fecha de nacimiento *</Label><Input {...formTrab.register('fechaNacimiento')} type="date" />{formTrab.formState.errors.fechaNacimiento && <p className="text-xs text-destructive">{formTrab.formState.errors.fechaNacimiento.message}</p>}</div>
                      <div className="space-y-1.5"><Label>Estado civil *</Label>
                        <select {...formTrab.register('estadoCivil')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                          <option value="">— seleccionar —</option>
                          <option value="SOLTERO">Soltero/a</option>
                          <option value="CASADO">Casado/a</option>
                          <option value="DIVORCIADO">Divorciado/a</option>
                          <option value="VIUDO">Viudo/a</option>
                          <option value="CONVIVIENTE_CIVIL">Conviviente civil</option>
                        </select>
                        {formTrab.formState.errors.estadoCivil && <p className="text-xs text-destructive">{formTrab.formState.errors.estadoCivil.message}</p>}
                      </div>
                      <div className="space-y-1.5"><Label>Nacionalidad *</Label><Input {...formTrab.register('nacionalidad')} placeholder="Chilena" />{formTrab.formState.errors.nacionalidad && <p className="text-xs text-destructive">{formTrab.formState.errors.nacionalidad.message}</p>}</div>
                      <div className="space-y-1.5"><Label>Región</Label><Input {...formTrab.register('region')} placeholder="Región Metropolitana" /></div>
                      <div className="space-y-1.5"><Label>Comuna</Label><Input {...formTrab.register('comuna')} placeholder="Santiago" /></div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5"><Label>Cargo *</Label><Input {...formTrab.register('cargo')} placeholder="Contador" />{formTrab.formState.errors.cargo && <p className="text-xs text-destructive">{formTrab.formState.errors.cargo.message}</p>}</div>
                    <div className="space-y-1.5"><Label>Tipo</Label>
                      <select {...formTrab.register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        <option value="DEPENDIENTE">Dependiente</option>
                        <option value="SUELDO_EMPRESARIAL">Sueldo Empresarial</option>
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label>Contrato</Label>
                      <select {...formTrab.register('tipoContrato')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        <option value="INDEFINIDO">Indefinido</option>
                        <option value="PLAZO_FIJO">Plazo Fijo</option>
                        <option value="OBRA_FAENA">Obra/Faena</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Sueldo base *</Label><Input {...formTrab.register('sueldoBase', { valueAsNumber: true })} type="number" min="0" />{formTrab.formState.errors.sueldoBase && <p className="text-xs text-destructive">{formTrab.formState.errors.sueldoBase.message}</p>}</div>
                    <div className="space-y-1.5"><Label>Fecha ingreso *</Label><Input {...formTrab.register('fechaIngreso')} type="date" /></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>AFP</Label>
                      <select {...formTrab.register('afp')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        {AFP_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label>Institución de salud</Label>
                      <select {...formTrab.register('salud')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        {SALUD_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label>% Cotización salud</Label><Input {...formTrab.register('pctSalud', { valueAsNumber: true })} type="number" step="0.001" min="0" max="1" placeholder="0.07" /></div>
                    {formTrab.watch('salud') !== 'FONASA' && (
                      <div className="space-y-1.5">
                        <Label>Plan ISAPRE (UF/mes)</Label>
                        <Input {...formTrab.register('montoIsapre', { valueAsNumber: true })} type="number" step="0.01" min="0" placeholder="3.50" />
                        <p className="text-xs text-muted-foreground">Si el plan supera el 7% del imponible, se descuenta la diferencia.</p>
                      </div>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Gratificación</Label>
                      <select {...formTrab.register('tipoGratificacion')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        <option value="ART_50">Art. 50 (25% con tope IMM)</option>
                        <option value="ART_50_LIBRE">Art. 50 libre (25% sin tope)</option>
                        <option value="ART_47">Art. 47 (anual manual)</option>
                        <option value="NINGUNA">Ninguna</option>
                      </select>
                    </div>
                    <div className="space-y-1.5"><Label>Jornada (h/semana)</Label><Input {...formTrab.register('jornadaHoras', { valueAsNumber: true })} type="number" min="1" max="45" /></div>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" {...formTrab.register('tieneCes')} className="h-4 w-4 accent-primary" /> CES (Seguro cesantía)</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" {...formTrab.register('tieneMovilizacion')} className="h-4 w-4 accent-primary" /> Movilización</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" {...formTrab.register('tieneColacion')} className="h-4 w-4 accent-primary" /> Colación</label>
                  </div>
                  {createTrab.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createTrab.error.message}</p>}
                </form>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setOpenTrabajador(false); setEditando(null); }}>Cancelar</Button>
                  <Button type="submit" form="form-trab" disabled={createTrab.isPending || updateTrab.isPending}>
                    {(createTrab.isPending || updateTrab.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Dialog open={openFiniquito} onOpenChange={(v) => { if (!v) { formFiniquito.reset(); setFiniquitandoTrab(null); } setOpenFiniquito(v); }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Finiquitar — {finiquitandoTrab?.nombre}</DialogTitle>
                <DialogDescription>Se calculará la liquidación final y se generará el documento.</DialogDescription>
              </DialogHeader>
              <form id="form-finiquito" onSubmit={formFiniquito.handleSubmit(onSubmitFiniquito)} className="space-y-4">
                <div className="space-y-1.5"><Label>Causal de término *</Label>
                  <select {...formFiniquito.register('causal')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {CAUSALES_FINIQUITO.map((c) => <option key={c} value={c}>{CAUSAL_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2"><Label>Fecha de término *</Label><Input {...formFiniquito.register('fechaTermino')} type="date" /></div>
                  <div className="space-y-1.5"><Label>Días vacaciones pendientes</Label><Input {...formFiniquito.register('diasVacaciones', { valueAsNumber: true })} type="number" min="0" step="0.5" /></div>
                  <div className="space-y-1.5"><Label>Otros descuentos ($)</Label><Input {...formFiniquito.register('otrosDescuentos', { valueAsNumber: true })} type="number" min="0" /></div>
                </div>
                {['161_NECESIDADES', '161_DESAHUCIO'].includes(formFiniquito.watch('causal')) && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" {...formFiniquito.register('avisoPrevioOtorgado')} className="h-4 w-4 accent-primary" defaultChecked />
                    Se otorgaron 30 días de aviso previo (no cobrar sustitución de aviso)
                  </label>
                )}
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpenFiniquito(false); setFiniquitandoTrab(null); }}>Cancelar</Button>
                <Button type="submit" form="form-finiquito">Generar y abrir finiquito</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loadingTrab ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : trabajadores.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">Sin trabajadores registrados</p>
            </CardContent></Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Trabajador</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cargo</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Sueldo base</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">AFP</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="w-40" />
                </tr></thead>
                <tbody>
                  {trabajadores.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4"><p className="font-medium">{t.nombre}</p><p className="text-xs text-muted-foreground">{t.rut}</p></td>
                      <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{t.cargo ?? '—'}</td>
                      <td className="px-5 py-4 text-right font-mono">{clp(t.sueldoBase)}</td>
                      <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{t.afp}</td>
                      <td className="px-5 py-4"><Badge variant={t.activo ? 'default' : 'outline'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(t)} title="Editar"><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => abrirContrato(t)} title="Ver contrato"><Printer className="h-3.5 w-3.5" /></Button>
                          {t.activo ? <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-600" onClick={() => { setFiniquitandoTrab(t); setOpenFiniquito(true); }} title="Finiquitar"><Briefcase className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => desactivar.mutate(t.id)} title="Desactivar"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </> : (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" onClick={() => reactivar.mutate(t.id)} title="Reactivar trabajador"><RotateCcw className="h-3.5 w-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* VISTA LIQUIDACIONES */}
      {vista === 'liquidaciones' && (
        <>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={abrirLibroRemuneraciones} disabled={liquidaciones.length === 0}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />Libro de Rem.
              </Button>
              <Button variant="outline" size="sm" onClick={descargarLRE} disabled={liquidaciones.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />LRE / DT
              </Button>
            <Dialog open={openLiq} onOpenChange={(v) => { if (!v) { formLiq.reset(); createLiq.reset(); } setOpenLiq(v); }}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nueva liquidación</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Nueva liquidación</DialogTitle><DialogDescription>La retención se calcula automáticamente según AFP, salud e impuesto único.</DialogDescription></DialogHeader>
                <form id="form-liq" onSubmit={formLiq.handleSubmit(onSubmitLiq)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Trabajador *</Label>
                    <select {...formLiq.register('trabajadorId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option value="">Seleccionar…</option>
                      {trabajadores.filter((t) => t.activo).map((t) => (
                        <option key={t.id} value={t.id}>{t.nombre} — {clp(t.sueldoBase)}</option>
                      ))}
                    </select>
                    {formLiq.formState.errors.trabajadorId && <p className="text-xs text-destructive">{formLiq.formState.errors.trabajadorId.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Año</Label><Input {...formLiq.register('anio', { valueAsNumber: true })} type="number" /></div>
                    <div className="space-y-1.5"><Label>Mes</Label>
                      <select {...formLiq.register('mes', { valueAsNumber: true })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Horas extra</Label><Input {...formLiq.register('horasExtra', { valueAsNumber: true })} type="number" min="0" step="0.5" /></div>
                    <div className="space-y-1.5"><Label>Bono ($)</Label><Input {...formLiq.register('bono', { valueAsNumber: true })} type="number" min="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>Días trabajados</Label><Input {...formLiq.register('diasTrabajados', { valueAsNumber: true })} type="number" min="0" max="31" /></div>
                    <div className="space-y-1.5"><Label>Anticipo ($)</Label><Input {...formLiq.register('anticipo', { valueAsNumber: true })} type="number" min="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>UTM del período</Label><Input {...formLiq.register('utm', { valueAsNumber: true })} type="number" min="0" /></div>
                    <div className="space-y-1.5"><Label>IMM del período</Label><Input {...formLiq.register('imm', { valueAsNumber: true })} type="number" min="0" /></div>
                  </div>
                  {createLiq.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createLiq.error.message}</p>}
                </form>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenLiq(false)}>Cancelar</Button>
                  <Button type="submit" form="form-liq" disabled={createLiq.isPending}>{createLiq.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Calcular y guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          </div>

          {!loadingLiq && liquidaciones.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total líquido a pagar</p><p className="text-xl font-bold font-mono mt-1">{clp(totalLiquido)}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Costo total empleador</p><p className="text-xl font-bold font-mono mt-1 text-destructive">{clp(totalCosto)}</p></CardContent></Card>
            </div>
          )}

          {loadingLiq ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : liquidaciones.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">Sin liquidaciones en este período</p>
            </CardContent></Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/50">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Trabajador</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Imponible</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Descuentos</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Líquido</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="w-20" />
                </tr></thead>
                <tbody>
                  {liquidaciones.map((l) => {
                    const descuentos = Number(l.cotizAfp) + Number(l.cotizSalud) + Number(l.cotizCes) + Number(l.impuestoUnico);
                    return (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4"><p className="font-medium">{l.trabajador?.nombre ?? '—'}</p><p className="text-xs text-muted-foreground">{l.trabajador?.rut}</p></td>
                        <td className="px-5 py-4 text-right font-mono hidden sm:table-cell">{clp(l.imponible)}</td>
                        <td className="px-5 py-4 text-right font-mono text-destructive hidden md:table-cell">{clp(descuentos)}</td>
                        <td className="px-5 py-4 text-right font-mono font-semibold">{clp(l.liquido)}</td>
                        <td className="px-5 py-4"><Badge variant={l.pagada ? 'default' : 'outline'}>{l.pagada ? 'Pagada' : 'Pendiente'}</Badge></td>
                        <td className="px-5 py-4 flex items-center gap-1">
                          {!l.pagada && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" onClick={() => pagarLiq.mutate(l.id)} title="Marcar pagada"><CheckCircle className="h-3.5 w-3.5" /></Button>}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => abrirPdfLiquidacion(l)} title="Ver liquidación PDF"><Printer className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteLiq.mutate(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
