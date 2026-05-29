import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users, FileText, Trash2, Loader2, CheckCircle, Pencil, Download, Printer, Briefcase, RotateCcw, Zap, Umbrella, ClipboardList, AlertTriangle, Mail } from 'lucide-react';
import api from '@/lib/api';
import { REGIONES_DT, COMUNAS_DT } from '@/lib/dt-geo';
import { trabajadorSchema, finiquitoInputSchema, vacacionSchema, permisoSchema, CAUSALES_FINIQUITO, type TrabajadorInput, type LiquidacionInput, type FiniquitoInput, type VacacionInput, type PermisoInput } from '@contaweb/validations';
import type { Trabajador, Liquidacion, VacacionSaldo, Permiso } from '@contaweb/shared-types';
import { useTrabajadores, useCreateTrabajador, useUpdateTrabajador, useDesactivarTrabajador, useReactivarTrabajador } from '@/hooks/useTrabajadores';
import { useLiquidaciones, useCreateLiquidacion, useUpdateLiquidacion, useDeleteLiquidacion, usePagarLiquidacion } from '@/hooks/useLiquidaciones';
import { useVacaciones, useVacacionSaldos, useCreateVacacion, useDeleteVacacion } from '@/hooks/useVacaciones';
import { usePermisos, useCreatePermiso, useDeletePermiso } from '@/hooks/usePermisos';
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

function alertaContrato(t: { tipoContrato: string; fechaTerminoContrato?: string }): { texto: string; clase: string } | null {
  if (!t.fechaTerminoContrato || t.tipoContrato === 'INDEFINIDO') return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const termino = new Date(t.fechaTerminoContrato.split('T')[0] + 'T12:00:00');
  const dias = Math.round((termino.getTime() - hoy.getTime()) / 86400000);
  if (dias < 0) return { texto: 'Vencido', clase: 'bg-red-100 text-red-700 border-red-200' };
  if (dias <= 30) return { texto: `Vence en ${dias}d`, clase: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (dias <= 60) return { texto: `Vence en ${dias}d`, clase: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  return null;
}

type Vista = 'trabajadores' | 'liquidaciones' | 'libro' | 'vacaciones' | 'permisos';

const TIPO_PERMISO_LABELS: Record<string, string> = {
  MATRIMONIO: 'Matrimonio (Art. 207 bis CT — 5 días)',
  UNION_CIVIL: 'Unión Civil (Ley 20.830 — 5 días)',
  FALLECIMIENTO: 'Fallecimiento (Art. 66 CT — 3 días)',
  SIN_GOCE: 'Sin Goce de Sueldo',
  ADMINISTRATIVO: 'Permiso Administrativo',
  OTRO: 'Otro',
};

const DIAS_LEGALES_PERMISO: Partial<Record<string, number>> = {
  MATRIMONIO: 5,
  UNION_CIVIL: 5,
  FALLECIMIENTO: 3,
};

const CON_GOCE_PERMISO: Record<string, boolean> = {
  MATRIMONIO: true,
  UNION_CIVIL: true,
  FALLECIMIENTO: true,
  SIN_GOCE: false,
  ADMINISTRATIVO: true,
  OTRO: true,
};

function diasHabilesEntre(inicio: string, fin: string, includeWeekends = false): number {
  if (!inicio || !fin) return 0;
  let count = 0;
  const d = new Date(inicio + 'T12:00:00');
  const end = new Date(fin + 'T12:00:00');
  if (d > end) return 0;
  while (d <= end) {
    const day = d.getDay();
    if (includeWeekends || (day !== 0 && day !== 6)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export default function RRHH() {
  const hoy = new Date();
  const [vista, setVista] = useState<Vista>('trabajadores');
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [openTrabajador, setOpenTrabajador] = useState(false);
  const [openFiniquito, setOpenFiniquito] = useState(false);
  const [editando, setEditando] = useState<Trabajador | null>(null);
  const [finiquitandoTrab, setFiniquitandoTrab] = useState<Trabajador | null>(null);
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos');
  const [utm, setUtm] = useState(68400);
  const [imm, setImm] = useState(539000);
  const [movs, setMovs] = useState<Record<string, { horasExtra: number; horasExtraFeriado: number; bono: number; diasTrabajados: number; anticipo: number; horasDescuento: number; otrosDescuentos: number }>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [procesando, setProcesando] = useState<Set<string>>(new Set());
  const [openVacacion, setOpenVacacion] = useState(false);
  const [filtroVacTrab, setFiltroVacTrab] = useState<string>('todos');
  const [openPermiso, setOpenPermiso] = useState(false);
  const [filtroPermTrab, setFiltroPermTrab] = useState<string>('todos');

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data: trabData, isLoading: loadingTrab } = useTrabajadores(empresa?.id ?? '');
  const { data: liqData, isLoading: loadingLiq } = useLiquidaciones(empresa?.id ?? '', anio, mes);
  const createTrab = useCreateTrabajador(empresa?.id ?? '');
  const updateTrab = useUpdateTrabajador(empresa?.id ?? '', editando?.id ?? '');
  const desactivar = useDesactivarTrabajador(empresa?.id ?? '');
  const reactivar = useReactivarTrabajador(empresa?.id ?? '');
  const createLiq = useCreateLiquidacion(empresa?.id ?? '');
  const updateLiq = useUpdateLiquidacion(empresa?.id ?? '');
  const deleteLiq = useDeleteLiquidacion(empresa?.id ?? '');
  const pagarLiq = usePagarLiquidacion(empresa?.id ?? '');
  const { data: vacData } = useVacaciones(empresa?.id ?? '');
  const { data: saldosData, isLoading: loadingSaldos } = useVacacionSaldos(empresa?.id ?? '');
  const createVac = useCreateVacacion(empresa?.id ?? '');
  const deleteVac = useDeleteVacacion(empresa?.id ?? '');
  const { data: permData } = usePermisos(empresa?.id ?? '');
  const createPerm = useCreatePermiso(empresa?.id ?? '');
  const deletePerm = useDeletePermiso(empresa?.id ?? '');

  const formVac = useForm<VacacionInput>({
    resolver: zodResolver(vacacionSchema),
    defaultValues: { tipo: 'NORMAL' },
  });
  const watchFechaInicio = formVac.watch('fechaInicio');
  const watchFechaFin = formVac.watch('fechaFin');
  const watchTrabId = formVac.watch('trabajadorId');
  const diasHabilesCalc = diasHabilesEntre(
    watchFechaInicio ? String(watchFechaInicio).slice(0, 10) : '',
    watchFechaFin ? String(watchFechaFin).slice(0, 10) : '',
  );

  const formPerm = useForm<PermisoInput>({
    resolver: zodResolver(permisoSchema),
    defaultValues: { tipo: 'MATRIMONIO', conGoce: true },
  });
  const watchPermFechaInicio = formPerm.watch('fechaInicio');
  const watchPermFechaFin = formPerm.watch('fechaFin');
  const watchPermTipo = formPerm.watch('tipo');
  const watchPermConGoce = formPerm.watch('conGoce');
  const watchPermTrabId = formPerm.watch('trabajadorId');
  const permTrabajador = (trabData?.data ?? []).find((t: Trabajador) => t.id === watchPermTrabId);
  const diasHabilesPermCalc = diasHabilesEntre(
    watchPermFechaInicio ? String(watchPermFechaInicio).slice(0, 10) : '',
    watchPermFechaFin ? String(watchPermFechaFin).slice(0, 10) : '',
    permTrabajador?.trabajaFinSemana ?? false,
  );
  const fechasPermValidas = !!watchPermFechaInicio && !!watchPermFechaFin &&
    new Date(String(watchPermFechaFin).slice(0, 10) + 'T12:00:00') >=
    new Date(String(watchPermFechaInicio).slice(0, 10) + 'T12:00:00');

  const todosLosTrabajadores = trabData?.data ?? [];

  const periodosDisponibles = (() => {
    if (!watchTrabId) return [] as { value: string; label: string; agotado: boolean }[];
    const trab = todosLosTrabajadores.find(t => t.id === watchTrabId);
    if (!trab) return [] as { value: string; label: string; agotado: boolean }[];
    const ingreso = new Date(trab.fechaIngreso.slice(0, 10) + 'T12:00:00');
    const hoy = new Date();
    const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const vacTrab = (vacData?.data ?? []).filter(v => v.trabajadorId === watchTrabId);
    const opciones: { value: string; label: string; agotado: boolean }[] = [];
    let n = 1;
    while (true) {
      const ini = new Date(ingreso);
      ini.setFullYear(ingreso.getFullYear() + (n - 1));
      if (ini > hoy) break;
      const fin = new Date(ingreso);
      fin.setFullYear(ingreso.getFullYear() + n);
      const value = `Año ${n} · ${fmt(ini)} – ${fmt(fin)}`;
      const prog = n < 10 ? 0 : Math.floor((n - 10) / 3) + 1;
      const derecho = 15 + prog;
      const usados = vacTrab.filter(v => v.periodoAnual === value).reduce((s, v) => s + v.diasHabiles, 0);
      const disponibles = Math.max(0, derecho - usados);
      const agotado = usados >= derecho;
      const estado = agotado
        ? `  ⛔ agotado (${usados}/${derecho})`
        : usados > 0
          ? `  · ${disponibles} disp. de ${derecho}`
          : `  · ${derecho} disponibles`;
      opciones.push({ value, label: `${value}${estado}`, agotado });
      n++;
    }
    return opciones.reverse();
  })();

  // Estado acumulado por (trabajadorId, periodoAnual) para el historial
  const periodoStatusMap = (() => {
    const map = new Map<string, { usados: number; derecho: number }>();
    for (const v of vacData?.data ?? []) {
      if (!v.periodoAnual) continue;
      const key = `${v.trabajadorId}|||${v.periodoAnual}`;
      const m = v.periodoAnual.match(/^Año (\d+)/);
      const n = m ? parseInt(m[1]!) : 1;
      const prog = n < 10 ? 0 : Math.floor((n - 10) / 3) + 1;
      const derecho = 15 + prog;
      const prev = map.get(key);
      map.set(key, { usados: (prev?.usados ?? 0) + v.diasHabiles, derecho });
    }
    return map;
  })();

  const trabajadores = todosLosTrabajadores.filter((t) =>
    filtroActivo === 'todos' ? true : filtroActivo === 'activos' ? t.activo : !t.activo
  );
  const liquidaciones = liqData?.data ?? [];

  const formTrab = useForm<TrabajadorInput>({
    resolver: zodResolver(trabajadorSchema),
    defaultValues: { tipo: 'DEPENDIENTE', afp: 'HABITAT', salud: 'FONASA', pctSalud: 0.07, tieneCes: false, tipoGratificacion: 'ART_50', tieneMovilizacion: false, tieneColacion: false, tieneConectividad: false, cargasFamiliares: 0, trabajaFinSemana: false, jornadaHoras: 42, tipoContrato: 'INDEFINIDO' },
  });

  const tipoContratoWatch = formTrab.watch('tipoContrato');
  const fechaIngresoWatch = formTrab.watch('fechaIngreso');
  const [plazoMesesSeleccionado, setPlazoMesesSeleccionado] = useState<number | null>(null);

  // Parsea "YYYY-MM-DD" en hora local para evitar drift de timezone UTC
  function parseFechaLocal(fecha: string | Date): Date {
    const str = (typeof fecha === 'string' ? fecha : fecha.toISOString()).split('T')[0] ?? '';
    const parts = str.split('-').map(Number);
    return new Date(parts[0] ?? 0, (parts[1] ?? 1) - 1, parts[2] ?? 1);
  }

  function formatFechaLocal(fecha: Date): string {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function aplicarPlazoMeses(meses: number) {
    const base = fechaIngresoWatch ? parseFechaLocal(fechaIngresoWatch) : new Date();
    base.setMonth(base.getMonth() + meses);
    formTrab.setValue('fechaTerminoContrato', formatFechaLocal(base) as unknown as Date);
    setPlazoMesesSeleccionado(meses);
  }

  useEffect(() => {
    if (!plazoMesesSeleccionado || !fechaIngresoWatch) return;
    const base = parseFechaLocal(fechaIngresoWatch);
    base.setMonth(base.getMonth() + plazoMesesSeleccionado);
    formTrab.setValue('fechaTerminoContrato', formatFechaLocal(base) as unknown as Date);
  }, [fechaIngresoWatch]); // eslint-disable-line react-hooks/exhaustive-deps

  const regionSeleccionada = formTrab.watch('region');
  const comunasFiltradas = regionSeleccionada
    ? COMUNAS_DT.filter(c => c.region === regionSeleccionada)
    : COMUNAS_DT;

  const formFiniquito = useForm<FiniquitoInput>({
    resolver: zodResolver(finiquitoInputSchema),
    defaultValues: { causal: '159_N1', diasVacaciones: 0, avisoPrevioOtorgado: true, otrosDescuentos: 0 },
  });

  function onSubmitTrab(d: TrabajadorInput) {
    const mutation = editando ? updateTrab : createTrab;
    mutation.mutate(d, {
      onSuccess: () => { formTrab.reset(); mutation.reset(); setOpenTrabajador(false); setEditando(null); setPlazoMesesSeleccionado(null); },
    });
  }

  async function onSubmitVac(d: VacacionInput) {
    createVac.mutate(d, {
      onSuccess: () => { formVac.reset({ tipo: 'NORMAL' }); createVac.reset(); setOpenVacacion(false); },
    });
  }

  async function abrirComprobanteFeriado(vacId: string) {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/vacaciones/${vacId}/comprobante`, { responseType: 'text' });
    const blob = new Blob([res.data as string], { type: 'text/html; charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function abrirComprobantePermiso(permId: string) {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/permisos/${permId}/comprobante`, { responseType: 'text' });
    const blob = new Blob([res.data as string], { type: 'text/html; charset=utf-8' });
    window.open(URL.createObjectURL(blob), '_blank');
  }

  async function onSubmitPermiso(d: PermisoInput) {
    createPerm.mutate(d, {
      onSuccess: () => { formPerm.reset({ tipo: 'MATRIMONIO', conGoce: true }); createPerm.reset(); setOpenPermiso(false); },
    });
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
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  async function enviarEmailLiquidacion(l: Liquidacion, t: Trabajador) {
    if (!empresa) return;
    const emailTrab = (t as typeof t & { email?: string | null }).email;
    const emailDest = emailTrab || window.prompt(`Correo de ${t.nombre}:`, '') || '';
    if (!emailDest.trim()) return;
    setEnviandoEmail(prev => new Set(prev).add(l.id));
    try {
      await api.post(`/api/empresas/${empresa.id}/liquidaciones/${l.id}/enviar-email`, { email: emailDest });
      alert(`Liquidación enviada a ${emailDest}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al enviar';
      alert(msg);
    } finally {
      setEnviandoEmail(prev => { const s = new Set(prev); s.delete(l.id); return s; });
    }
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
    const f = (n: number | string | undefined | null) =>
      Number(n ?? 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
    type LiqExt = typeof liquidaciones[0] & {
      sueldoBase?: number; horasExtra?: number; bono?: number; gratificacion?: number;
      movilizacion?: number; colacion?: number; anticipo?: number; cotizSis?: number; diasTrabajados?: number;
    };
    const liqs = liquidaciones as LiqExt[];

    const th = (txt: string, align = 'right', width = '') =>
      `<th style="padding:4px 5px;font-size:7pt;font-weight:700;text-align:${align};border:1px solid #9ca3af;background:#e5e7eb;white-space:nowrap;${width ? `width:${width};` : ''}">${txt}</th>`;
    const td = (txt: string, align = 'right', bold = false, color = '') =>
      `<td style="padding:4px 5px;font-size:7pt;text-align:${align};border:1px solid #d1d5db;font-family:${align === 'right' ? 'monospace' : 'Arial'};${bold ? 'font-weight:700;' : ''}${color ? `color:${color};` : ''}">${txt}</td>`;
    const tdC = (n: number | string | undefined | null, bold = false, color = '') =>
      td(f(n), 'right', bold, color);

    const filas = liqs.map((l, i) => {
      const noImponible = Number(l.movilizacion ?? 0) + Number(l.colacion ?? 0);
      const totalDesc = Number(l.cotizAfp) + Number(l.cotizSis ?? 0) + Number(l.cotizSalud) +
        Number(l.cotizCes ?? 0) + Number(l.impuestoUnico ?? 0);
      const totalBruto = Number(l.imponible) + noImponible;
      return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        ${td(String(i + 1), 'center')}
        ${td(l.trabajador?.rut ?? '—', 'left')}
        ${td(l.trabajador?.nombre ?? '—', 'left')}
        ${td(l.trabajador?.cargo ?? '—', 'left')}
        ${td(l.trabajador?.afp ?? '—', 'left')}
        ${td(l.trabajador?.salud ?? '—', 'left')}
        ${td(String(l.diasTrabajados ?? 30), 'center')}
        ${tdC(l.sueldoBase)}
        ${tdC(l.horasExtra)}
        ${tdC(l.bono)}
        ${tdC(l.gratificacion)}
        ${tdC(l.movilizacion)}
        ${tdC(l.colacion)}
        ${tdC(noImponible)}
        ${tdC(l.imponible, true)}
        ${tdC(totalBruto, true)}
        ${tdC(l.cotizAfp)}
        ${tdC(l.cotizSis)}
        ${tdC(l.cotizSalud)}
        ${tdC(l.cotizCes)}
        ${tdC(l.impuestoUnico)}
        ${tdC(totalDesc, true)}
        ${tdC(l.anticipo)}
        ${tdC(l.liquido, true, '#166534')}
        ${td('_________________', 'center')}
      </tr>`;
    }).join('');

    const tots = liqs.reduce((a, l) => {
      const noImp = Number(l.movilizacion ?? 0) + Number(l.colacion ?? 0);
      const desc = Number(l.cotizAfp) + Number(l.cotizSis ?? 0) + Number(l.cotizSalud) + Number(l.cotizCes ?? 0) + Number(l.impuestoUnico ?? 0);
      return {
        sueldo: a.sueldo + Number(l.sueldoBase ?? 0),
        horasExtra: a.horasExtra + Number(l.horasExtra ?? 0),
        bono: a.bono + Number(l.bono ?? 0),
        gratif: a.gratif + Number(l.gratificacion ?? 0),
        mov: a.mov + Number(l.movilizacion ?? 0),
        col: a.col + Number(l.colacion ?? 0),
        noImponible: a.noImponible + noImp,
        imponible: a.imponible + Number(l.imponible),
        bruto: a.bruto + Number(l.imponible) + noImp,
        cotizAfp: a.cotizAfp + Number(l.cotizAfp),
        cotizSis: a.cotizSis + Number(l.cotizSis ?? 0),
        cotizSalud: a.cotizSalud + Number(l.cotizSalud),
        cotizCes: a.cotizCes + Number(l.cotizCes ?? 0),
        impuesto: a.impuesto + Number(l.impuestoUnico ?? 0),
        descuentos: a.descuentos + desc,
        anticipo: a.anticipo + Number(l.anticipo ?? 0),
        liquido: a.liquido + Number(l.liquido),
      };
    }, { sueldo:0, horasExtra:0, bono:0, gratif:0, mov:0, col:0, noImponible:0, imponible:0, bruto:0, cotizAfp:0, cotizSis:0, cotizSalud:0, cotizCes:0, impuesto:0, descuentos:0, anticipo:0, liquido:0 });

    const hoy = new Date().toLocaleDateString('es-CL');
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<title>Libro de Remuneraciones ${mesLabel} ${anio}</title>
<style>
@page{size:A3 landscape;margin:10mm}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:8pt;padding:12px 16px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:20px}
.empresa-info{flex:1}
.empresa-info p{margin-bottom:2px;font-size:8pt}
.titulo-bloque{text-align:center;flex:2}
.titulo{font-size:13pt;font-weight:700;text-transform:uppercase;margin-bottom:4px}
.subtitulo{font-size:8pt;color:#555}
.legal-ref{font-size:7pt;color:#888;margin-top:2px}
.periodo-bloque{text-align:right;flex:1}
table{width:100%;border-collapse:collapse;margin-top:10px}
.total-row td{background:#e5e7eb!important;font-weight:700}
.firmas{display:flex;justify-content:space-around;margin-top:40px;page-break-inside:avoid}
.firma-box{text-align:center}
.firma-line{border-top:1px solid #333;min-width:180px;padding-top:4px;font-size:7.5pt;color:#374151;margin-top:50px}
.nota{font-size:6.5pt;color:#9ca3af;margin-top:16px;border-top:1px solid #e5e7eb;padding-top:6px}
@media print{body{padding:0}.nota{color:#bbb}}
</style>
</head>
<body>
<div class="header">
  <div class="empresa-info">
    <p><strong>Razón Social:</strong> ${empresa?.razonSocial ?? ''}</p>
    <p><strong>RUT:</strong> ${empresa?.rut ?? ''}</p>
    <p><strong>Giro:</strong> ${empresa?.giro ?? ''}</p>
    <p><strong>Dirección:</strong> ${empresa?.direccion ?? ''}</p>
  </div>
  <div class="titulo-bloque">
    <div class="titulo">Libro de Remuneraciones</div>
    <div class="subtitulo">Período: <strong>${mesLabel} ${anio}</strong> &nbsp;·&nbsp; ${liquidaciones.length} trabajador(es)</div>
    <div class="legal-ref">Art. 62 Código del Trabajo — DS N°969/1933 Ministerio del Trabajo</div>
  </div>
  <div class="periodo-bloque">
    <p style="font-size:7pt;color:#555">Fecha emisión: ${hoy}</p>
    <p style="font-size:7pt;color:#555;margin-top:4px">Timbrado SII / LRE-DT</p>
  </div>
</div>

<table>
  <thead>
    <tr>
      ${th('N°','center','28px')}
      ${th('RUT','left')}
      ${th('Nombre y Apellido','left')}
      ${th('Cargo','left')}
      ${th('AFP','left')}
      ${th('Salud','left')}
      ${th('Días','center','34px')}
      ${th('Sueldo Base')}
      ${th('H. Extra')}
      ${th('Bonos')}
      ${th('Gratificación')}
      ${th('Movilización')}
      ${th('Colación')}
      ${th('No Imponible')}
      ${th('Total Imponible')}
      ${th('Total Bruto')}
      ${th('Cotiz. AFP')}
      ${th('SIS')}
      ${th('Cotiz. Salud')}
      ${th('CES')}
      ${th('Imp. Único')}
      ${th('Tot. Descuentos')}
      ${th('Anticipo')}
      ${th('Líquido','right')}
      ${th('Firma Trabajador','center')}
    </tr>
  </thead>
  <tbody>${filas}</tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="7" style="padding:4px 5px;font-size:7pt;text-align:right;border:1px solid #9ca3af;font-weight:700;">TOTALES</td>
      ${tdC(tots.sueldo,true)}
      ${tdC(tots.horasExtra,true)}
      ${tdC(tots.bono,true)}
      ${tdC(tots.gratif,true)}
      ${tdC(tots.mov,true)}
      ${tdC(tots.col,true)}
      ${tdC(tots.noImponible,true)}
      ${tdC(tots.imponible,true)}
      ${tdC(tots.bruto,true)}
      ${tdC(tots.cotizAfp,true)}
      ${tdC(tots.cotizSis,true)}
      ${tdC(tots.cotizSalud,true)}
      ${tdC(tots.cotizCes,true)}
      ${tdC(tots.impuesto,true)}
      ${tdC(tots.descuentos,true)}
      ${tdC(tots.anticipo,true)}
      ${tdC(tots.liquido,true,'#166534')}
      <td style="border:1px solid #9ca3af"></td>
    </tr>
  </tfoot>
</table>

<div class="firmas">
  <div class="firma-box"><div class="firma-line">Empleador / Representante Legal</div></div>
  <div class="firma-box"><div class="firma-line">Contador / Responsable de Pago</div></div>
  <div class="firma-box"><div class="firma-line">Fecha y Lugar</div></div>
</div>

<p class="nota">
  Conforme al Art. 62 del Código del Trabajo y DS N°969/1933 del Ministerio del Trabajo y Previsión Social. El empleador que ocupe cinco o más trabajadores
  deberá llevar un libro auxiliar de remuneraciones timbrado por el SII. Las columnas SIS (Seguro de Invalidez y Sobrevivencia) corresponden al aporte
  del empleador. CES: Cotización AFC Seguro de Cesantía trabajador. Imp. Único: Impuesto Único de Segunda Categoría (Art. 42 N°1 LIR).
  Libro generado electrónicamente — versión imprimible del LRE presentado ante la Dirección del Trabajo.
</p>
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

  async function descargarPrevired() {
    if (!empresa) return;
    const res = await api.get(`/api/empresas/${empresa.id}/liquidaciones/previred`, {
      params: { anio, mes },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Previred_${empresa.rut}_${anio}_${String(mes).padStart(2, '0')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function normalizarCodigoDT<T extends { codigo: string; nombre: string }>(
    valor: string | undefined | null,
    lista: T[]
  ): string {
    if (!valor) return '';
    const esCodigoValido = lista.some(item => item.codigo === valor);
    if (esCodigoValido) return valor;
    return '';
  }

  function abrirEditar(t: Trabajador) {
    setEditando(t);
    const regionNorm = normalizarCodigoDT(t.region, REGIONES_DT as unknown as { codigo: string; nombre: string }[]);
    const comunaNorm = normalizarCodigoDT(t.comuna, COMUNAS_DT);
    formTrab.reset({
      rut: t.rut, nombre: t.nombre, cargo: t.cargo ?? '',
      ...(t.apellidoPaterno ? { apellidoPaterno: t.apellidoPaterno } : {}),
      ...(t.apellidoMaterno ? { apellidoMaterno: t.apellidoMaterno } : {}),
      ...(t.sexo ? { sexo: t.sexo as TrabajadorInput['sexo'] } : {}),
      ...(t.email ? { email: t.email } : {}),
      ...(t.domicilio ? { domicilio: t.domicilio } : {}),
      ...(t.fechaNacimiento ? { fechaNacimiento: t.fechaNacimiento.slice(0, 10) as unknown as Date } : {}),
      ...(t.estadoCivil ? { estadoCivil: t.estadoCivil as TrabajadorInput['estadoCivil'] } : {}),
      ...(t.nacionalidad ? { nacionalidad: t.nacionalidad } : {}),
      ...(regionNorm ? { region: regionNorm } : {}),
      ...(comunaNorm ? { comuna: comunaNorm } : {}),
      tipo: t.tipo, sueldoBase: Number(t.sueldoBase),
      afp: t.afp, salud: t.salud, pctSalud: Number(t.pctSalud),
      ...(t.montoIsapre ? { montoIsapre: Number(t.montoIsapre) } : {}),
      tieneCes: t.tieneCes, tipoGratificacion: t.tipoGratificacion,
      tieneMovilizacion: t.tieneMovilizacion, tieneColacion: t.tieneColacion,
      tieneConectividad: (t as typeof t & { tieneConectividad?: boolean }).tieneConectividad ?? false,
      cargasFamiliares: (t as typeof t & { cargasFamiliares?: number }).cargasFamiliares ?? 0,
      trabajaFinSemana: t.trabajaFinSemana,
      montoMovilizacion: t.montoMovilizacion ? Number(t.montoMovilizacion) : undefined,
      montoColacion: t.montoColacion ? Number(t.montoColacion) : undefined,
      jornadaHoras: t.jornadaHoras, tipoContrato: t.tipoContrato,
      fechaIngreso: t.fechaIngreso.slice(0, 10) as unknown as Date,
      fechaTerminoContrato: t.fechaTerminoContrato ? t.fechaTerminoContrato.slice(0, 10) as unknown as Date : undefined,
    });
    setOpenTrabajador(true);
  }

  const [sinGoceDesync, setSinGoceDesync] = useState<Set<string>>(new Set());
  const [enviandoEmail, setEnviandoEmail] = useState<Set<string>>(new Set());

  // reset movimientos cuando cambia el período
  useEffect(() => { setMovs({}); setDirty(new Set()); setSinGoceDesync(new Set()); }, [anio, mes]);

  // inicializar desde liquidaciones existentes (solo filas no-dirty)
  useEffect(() => {
    if (loadingLiq) return;
    setMovs((prev) => {
      const next: typeof prev = { ...prev };
      for (const l of liquidaciones) {
        const tid = l.trabajador?.id ?? '';
        if (!tid || tid in prev) continue;
        next[tid] = {
          horasExtra: Number(l.cantHorasExtra ?? 0),
          horasExtraFeriado: Number((l as typeof l & { cantHorasExtraFeriado?: string | null }).cantHorasExtraFeriado ?? 0),
          bono: Number(l.bono ?? 0),
          diasTrabajados: Number(l.diasTrabajados ?? 30),
          anticipo: Number(l.anticipo ?? 0),
          horasDescuento: Number(l.horasDescuento ?? 0),
          otrosDescuentos: Number(l.otrosDescuentos ?? 0),
        };
      }
      return next;
    });
  }, [liquidaciones, loadingLiq]);

  // Detectar desincronización: si el diasSinGoce guardado difiere de los permisos actuales
  useEffect(() => {
    if (!permData?.data || liquidaciones.length === 0) return;
    const desynced = new Set<string>();
    for (const liq of liquidaciones) {
      const tid = liq.trabajador?.id ?? '';
      if (!tid) continue;
      const savedSinGoce = Number(liq.diasSinGoce ?? 0);
      const estimado = (permData.data ?? [])
        .filter(p => {
          if (p.trabajadorId !== tid || p.conGoce) return false;
          const pI = new Date(p.fechaInicio); const pF = new Date(p.fechaFin);
          const mI = new Date(anio, mes - 1, 1); const mF = new Date(anio, mes, 0);
          return pI <= mF && pF >= mI;
        })
        .reduce((s, p) => s + p.diasHabiles, 0);
      if (estimado !== savedSinGoce) desynced.add(tid);
    }
    setSinGoceDesync(desynced);
    if (desynced.size > 0) {
      setDirty(prev => { const s = new Set(prev); desynced.forEach(id => s.add(id)); return s; });
    }
  }, [permData, liquidaciones, anio, mes]);

  const liqPorTrab = new Map(liquidaciones.map(l => [l.trabajador?.id ?? '', l]));

  function updateMov(trabId: string, field: string, val: number) {
    setMovs(prev => ({
      ...prev,
      [trabId]: { ...(prev[trabId] ?? { horasExtra: 0, horasExtraFeriado: 0, bono: 0, diasTrabajados: 30, anticipo: 0, horasDescuento: 0, otrosDescuentos: 0 }), [field]: val },
    }));
    setDirty(prev => { const s = new Set(prev); s.add(trabId); return s; });
  }

  async function calcularUno(trabId: string, liqExistente: typeof liquidaciones[0] | undefined) {
    const mov = movs[trabId] ?? { horasExtra: 0, horasExtraFeriado: 0, bono: 0, diasTrabajados: 30, anticipo: 0, horasDescuento: 0, otrosDescuentos: 0 };
    const input: LiquidacionInput = { trabajadorId: trabId, anio, mes, ...mov, utm, imm };
    setProcesando(s => { const n = new Set(s); n.add(trabId); return n; });
    try {
      if (liqExistente) {
        await updateLiq.mutateAsync({ id: liqExistente.id, data: input });
      } else {
        await createLiq.mutateAsync(input);
      }
      setDirty(s => { const n = new Set(s); n.delete(trabId); return n; });
      setSinGoceDesync(s => { const n = new Set(s); n.delete(trabId); return n; });
    } catch { /* mutation error surfaced via hook */ } finally {
      setProcesando(s => { const n = new Set(s); n.delete(trabId); return n; });
    }
  }

  async function calcularConCambios() {
    for (const t of todosLosTrabajadores.filter(t => t.activo && dirty.has(t.id))) {
      await calcularUno(t.id, liqPorTrab.get(t.id));
    }
  }

  async function calcularTodos() {
    for (const t of todosLosTrabajadores.filter(t => t.activo)) {
      await calcularUno(t.id, liqPorTrab.get(t.id));
    }
  }

  const totalLiquido = liquidaciones.reduce((s, l) => s + Number(l.liquido), 0);
  const totalCosto = liquidaciones.reduce((s, l) => s + Number(l.costoEmpleador), 0);
  type LiqExt = typeof liquidaciones[0] & {
    sueldoBase?: number; horasExtra?: number; bono?: number; gratificacion?: number;
    movilizacion?: number; colacion?: number; anticipo?: number; cotizSis?: number; diasTrabajados?: number;
  };
  const liqs = liquidaciones as LiqExt[];
  const libroTots = liqs.reduce((acc, l) => {
    const noImp = Number(l.movilizacion ?? 0) + Number(l.colacion ?? 0);
    const desc = Number(l.cotizAfp) + Number(l.cotizSis ?? 0) + Number(l.cotizSalud) + Number(l.cotizCes ?? 0) + Number(l.impuestoUnico ?? 0);
    return {
      sueldo: acc.sueldo + Number(l.sueldoBase ?? 0),
      horasExtra: acc.horasExtra + Number(l.horasExtra ?? 0),
      bono: acc.bono + Number(l.bono ?? 0),
      gratif: acc.gratif + Number(l.gratificacion ?? 0),
      noImponible: acc.noImponible + noImp,
      imponible: acc.imponible + Number(l.imponible),
      cotizAfp: acc.cotizAfp + Number(l.cotizAfp),
      cotizSis: acc.cotizSis + Number(l.cotizSis ?? 0),
      cotizSalud: acc.cotizSalud + Number(l.cotizSalud),
      cotizCes: acc.cotizCes + Number(l.cotizCes ?? 0),
      impuesto: acc.impuesto + Number(l.impuestoUnico ?? 0),
      descuentos: acc.descuentos + desc,
      anticipo: acc.anticipo + Number(l.anticipo ?? 0),
      liquido: acc.liquido + Number(l.liquido),
    };
  }, { sueldo:0, horasExtra:0, bono:0, gratif:0, noImponible:0, imponible:0, cotizAfp:0, cotizSis:0, cotizSalud:0, cotizCes:0, impuesto:0, descuentos:0, anticipo:0, liquido:0 });

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">RRHH — Remuneraciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant={vista === 'trabajadores' ? 'default' : 'outline'} size="sm" onClick={() => setVista('trabajadores')}>
            <Users className="mr-1.5 h-3.5 w-3.5" />Trabajadores
          </Button>
          <Button variant={vista === 'liquidaciones' ? 'default' : 'outline'} size="sm" onClick={() => setVista('liquidaciones')}>
            <FileText className="mr-1.5 h-3.5 w-3.5" />Liquidaciones
          </Button>
          <Button variant={vista === 'libro' ? 'default' : 'outline'} size="sm" onClick={() => setVista('libro')}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />Libro Rem.
          </Button>
          <Button variant={vista === 'vacaciones' ? 'default' : 'outline'} size="sm" onClick={() => setVista('vacaciones')}>
            <Umbrella className="mr-1.5 h-3.5 w-3.5" />Vacaciones
          </Button>
          <Button variant={vista === 'permisos' ? 'default' : 'outline'} size="sm" onClick={() => setVista('permisos')}>
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />Permisos
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
            <Dialog open={openTrabajador} onOpenChange={(v) => { if (!v) { formTrab.reset(); createTrab.reset(); setEditando(null); setPlazoMesesSeleccionado(null); } setOpenTrabajador(v); }}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo trabajador</Button></DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editando ? 'Editar trabajador' : 'Nuevo trabajador'}</DialogTitle>
                  <DialogDescription>Datos del contrato y previsión.</DialogDescription>
                </DialogHeader>
                <form id="form-trab" onSubmit={formTrab.handleSubmit(onSubmitTrab)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>RUT *</Label><Input {...formTrab.register('rut')} placeholder="12.345.678-9" />{formTrab.formState.errors.rut && <p className="text-xs text-destructive">{formTrab.formState.errors.rut.message}</p>}</div>
                    <div className="space-y-1.5"><Label>Nombre completo *</Label><Input {...formTrab.register('nombre')} placeholder="Juan Pérez González" /></div>
                    <div className="space-y-1.5 sm:col-span-2 border-t pt-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">Para Previred (opcional pero recomendado)</p>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <div className="space-y-1"><Label className="text-xs">Apellido paterno</Label><Input {...formTrab.register('apellidoPaterno')} placeholder="Pérez" /></div>
                        <div className="space-y-1"><Label className="text-xs">Apellido materno</Label><Input {...formTrab.register('apellidoMaterno')} placeholder="González" /></div>
                        <div className="space-y-1">
                          <Label className="text-xs">Sexo</Label>
                          <Controller control={formTrab.control} name="sexo" render={({ field }) => (
                            <select {...field} value={field.value ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                              <option value="">— —</option>
                              <option value="M">Masculino</option>
                              <option value="F">Femenino</option>
                            </select>
                          )} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 sm:col-span-2"><Label>Correo electrónico</Label><Input {...formTrab.register('email')} type="email" placeholder="juan@empresa.cl" /></div>
                  </div>
                  <div className="border-t pt-3 space-y-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Datos personales</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2"><Label>Domicilio *</Label><Input {...formTrab.register('domicilio')} placeholder="Av. Ejemplo 123, Santiago" />{formTrab.formState.errors.domicilio && <p className="text-xs text-destructive">{formTrab.formState.errors.domicilio.message}</p>}</div>
                      <div className="space-y-1.5"><Label>Fecha de nacimiento *</Label><Input {...formTrab.register('fechaNacimiento')} type="date" />{formTrab.formState.errors.fechaNacimiento && <p className="text-xs text-destructive">{formTrab.formState.errors.fechaNacimiento.message}</p>}</div>
                      <div className="space-y-1.5"><Label>Estado civil *</Label>
                        <Controller control={formTrab.control} name="estadoCivil" render={({ field }) => (
                          <select {...field} value={field.value ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                            <option value="">— seleccionar —</option>
                            <option value="SOLTERO">Soltero/a</option>
                            <option value="CASADO">Casado/a</option>
                            <option value="DIVORCIADO">Divorciado/a</option>
                            <option value="VIUDO">Viudo/a</option>
                            <option value="CONVIVIENTE_CIVIL">Conviviente civil</option>
                          </select>
                        )} />
                        {formTrab.formState.errors.estadoCivil && <p className="text-xs text-destructive">{formTrab.formState.errors.estadoCivil.message}</p>}
                      </div>
                      <div className="space-y-1.5"><Label>Nacionalidad *</Label><Input {...formTrab.register('nacionalidad')} placeholder="Chilena" />{formTrab.formState.errors.nacionalidad && <p className="text-xs text-destructive">{formTrab.formState.errors.nacionalidad.message}</p>}</div>
                      <div className="space-y-1.5">
                        <Label>Región *</Label>
                        <Controller control={formTrab.control} name="region" render={({ field }) => (
                          <select {...field} value={field.value ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                            <option value="">— seleccionar —</option>
                            {REGIONES_DT.map(r => (
                              <option key={r.codigo} value={r.codigo}>{r.nombre}</option>
                            ))}
                          </select>
                        )} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Comuna *</Label>
                        <Controller control={formTrab.control} name="comuna" render={({ field }) => (
                          <select {...field} value={field.value ?? ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                            <option value="">— seleccionar —</option>
                            {comunasFiltradas.map(c => (
                              <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                            ))}
                          </select>
                        )} />
                      </div>
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
                  {(tipoContratoWatch === 'PLAZO_FIJO' || tipoContratoWatch === 'OBRA_FAENA') && (
                    <div className="space-y-1.5">
                      <Label>Fecha término contrato {tipoContratoWatch === 'PLAZO_FIJO' ? '(máx. 1 año desde ingreso)' : ''}</Label>
                      {tipoContratoWatch === 'PLAZO_FIJO' && (
                        <div className="flex gap-2 mb-1.5">
                          {[1, 2, 3, 6].map((m) => (
                            <button key={m} type="button" onClick={() => aplicarPlazoMeses(m)}
                              className="px-2 py-1 text-xs rounded border border-input bg-muted hover:bg-accent transition-colors">
                              {m} {m === 1 ? 'mes' : 'meses'}
                            </button>
                          ))}
                        </div>
                      )}
                      <Input {...formTrab.register('fechaTerminoContrato', { onChange: () => setPlazoMesesSeleccionado(null) })} type="date" />
                    </div>
                  )}
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
                    <label className="flex items-center gap-2 cursor-pointer text-sm" title="Teletrabajo — col. 2309 LRE, no imponible"><input type="checkbox" {...formTrab.register('tieneConectividad')} className="h-4 w-4 accent-primary" /> Asig. Conectividad</label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm" title="Restaurantes, comercio, etc. — cuenta sábado y domingo como días hábiles"><input type="checkbox" {...formTrab.register('trabajaFinSemana')} className="h-4 w-4 accent-primary" /> Trabaja fines de semana</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">Cargas familiares</Label>
                    <Input {...formTrab.register('cargasFamiliares', { valueAsNumber: true })} type="number" min="0" max="20" className="w-20" />
                    <span className="text-xs text-muted-foreground">hijos u otras cargas legales</span>
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
                      <td className="px-5 py-4">
                        <p className="font-medium">{t.nombre}</p>
                        <p className="text-xs text-muted-foreground">{t.rut}</p>
                        {(() => { const a = alertaContrato(t); return a ? <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded border ${a.clase}`}>{a.texto}</span> : null; })()}
                      </td>
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
          {/* Encabezado: período + parámetros + acciones */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm">
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-20 h-8 text-sm" min="2000" max="2100" />
              <div className="h-6 border-l hidden sm:block" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">UTM</span>
                <Input type="number" value={utm} onChange={(e) => setUtm(Number(e.target.value))} className="w-24 h-8 text-sm" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">S.Mín.</span>
                <Input type="number" value={imm} onChange={(e) => setImm(Number(e.target.value))} className="w-28 h-8 text-sm" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={descargarLRE} disabled={liquidaciones.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />LRE / DT
              </Button>
              <Button variant="outline" size="sm" onClick={descargarPrevired} disabled={liquidaciones.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />Previred
              </Button>
              {dirty.size > 0 && (
                <Button size="sm" variant="outline" onClick={calcularConCambios}>
                  <Zap className="mr-1.5 h-3.5 w-3.5" />Calcular cambios ({dirty.size})
                </Button>
              )}
              <Button size="sm" onClick={calcularTodos} disabled={todosLosTrabajadores.filter(t => t.activo).length === 0}>
                <Zap className="mr-1.5 h-3.5 w-3.5" />Calcular todos
              </Button>
            </div>
          </div>

          {/* Banner desincronización sin goce */}
          {sinGoceDesync.size > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {sinGoceDesync.size === 1
                  ? '1 liquidación tiene permisos sin goce que cambiaron desde el último cálculo.'
                  : `${sinGoceDesync.size} liquidaciones tienen permisos sin goce que cambiaron desde el último cálculo.`}
                {' '}Presioná <strong>Calcular cambios</strong> para actualizar.
              </span>
            </div>
          )}

          {/* Tarjetas resumen */}
          {liquidaciones.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Total líquido a pagar</p><p className="text-xl font-bold font-mono mt-1">{clp(totalLiquido)}</p></CardContent></Card>
              <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Costo total empleador</p><p className="text-xl font-bold font-mono mt-1 text-destructive">{clp(totalCosto)}</p></CardContent></Card>
            </div>
          )}

          {/* Grilla de movimientos */}
          {(loadingLiq || loadingTrab) ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : todosLosTrabajadores.filter(t => t.activo).length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">No hay trabajadores activos</p>
            </CardContent></Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead><tr className="border-b bg-muted/50 text-xs">
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">Trabajador</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">H.Extra</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap" title="Horas extras trabajadas en feriado (recargo 100%)">H.Feriado</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">H.Desc.</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Bono $</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Días</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Anticipo $</th>
                    <th className="px-1.5 py-2.5 font-medium text-muted-foreground text-center whitespace-nowrap">Otros Desc. $</th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden 2xl:table-cell whitespace-nowrap">Mov.</th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden 2xl:table-cell whitespace-nowrap">Col.</th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground hidden xl:table-cell whitespace-nowrap">Imponible</th>
                    <th className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap">Líquido</th>
                    <th className="px-2 py-2.5 font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Estado</th>
                    <th className="sticky right-0 bg-muted/50 px-1.5 py-2.5 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10 w-[100px]" />
                  </tr></thead>
                  <tbody>
                    {todosLosTrabajadores.filter(t => t.activo).map(t => {
                      const liq = liqPorTrab.get(t.id);
                      const mov = movs[t.id] ?? { horasExtra: 0, horasExtraFeriado: 0, bono: 0, diasTrabajados: 30, anticipo: 0, horasDescuento: 0, otrosDescuentos: 0 };
                      const isDirty = dirty.has(t.id);
                      const isProc = procesando.has(t.id);
                      const diasSinGoceEst = (permData?.data ?? []).filter(p =>
                        p.trabajadorId === t.id && !p.conGoce && (() => {
                          const pI = new Date(p.fechaInicio); const pF = new Date(p.fechaFin);
                          const mI = new Date(anio, mes - 1, 1); const mF = new Date(anio, mes, 0);
                          return pI <= mF && pF >= mI;
                        })()
                      ).reduce((s, p) => s + p.diasHabiles, 0);
                      return (
                        <tr key={t.id} className={`border-b last:border-0 transition-colors ${isDirty ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-muted/20'}`}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              {isDirty && <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-amber-500" title="Cambios sin calcular" />}
                              <div className="min-w-0">
                                <p className="font-medium leading-tight truncate">{t.nombre}</p>
                                <p className="text-xs text-muted-foreground truncate">{t.cargo ?? t.rut}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" step="0.5" value={mov.horasExtra}
                              onChange={e => updateMov(t.id, 'horasExtra', Number(e.target.value))}
                              className="w-14 h-7 text-xs text-center px-1" />
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" step="0.5" value={mov.horasExtraFeriado}
                              onChange={e => updateMov(t.id, 'horasExtraFeriado', Number(e.target.value))}
                              className="w-14 h-7 text-xs text-center px-1 text-orange-600" title="Horas en feriado — recargo 100%" />
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" step="0.5" value={mov.horasDescuento}
                              onChange={e => updateMov(t.id, 'horasDescuento', Number(e.target.value))}
                              className="w-14 h-7 text-xs text-center px-1 text-destructive" />
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" value={mov.bono}
                              onChange={e => updateMov(t.id, 'bono', Number(e.target.value))}
                              className="w-20 h-7 text-xs text-right px-1" />
                          </td>
                          <td className="px-1 py-1.5">
                            <div className="flex flex-col items-center gap-0.5">
                              <Input type="number" min="0" max="31" value={mov.diasTrabajados}
                                onChange={e => updateMov(t.id, 'diasTrabajados', Number(e.target.value))}
                                className="w-12 h-7 text-xs text-center px-1" />
                              {diasSinGoceEst > 0 && (
                                <span className="text-[9px] leading-none text-muted-foreground" title={`${diasSinGoceEst} día${diasSinGoceEst > 1 ? 's' : ''} sin goce de sueldo — se calculan ${mov.diasTrabajados - diasSinGoceEst} días efectivos`}>
                                  {mov.diasTrabajados - diasSinGoceEst} ef.
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" value={mov.anticipo}
                              onChange={e => updateMov(t.id, 'anticipo', Number(e.target.value))}
                              className="w-20 h-7 text-xs text-right px-1" />
                          </td>
                          <td className="px-1 py-1.5">
                            <Input type="number" min="0" value={mov.otrosDescuentos}
                              onChange={e => updateMov(t.id, 'otrosDescuentos', Number(e.target.value))}
                              className="w-20 h-7 text-xs text-right px-1 text-destructive" />
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground hidden 2xl:table-cell">
                            {t.tieneMovilizacion ? clp(Math.round(Number(t.montoMovilizacion ?? 0) * ((movs[t.id]?.diasTrabajados ?? 30) / 30))) : <span className="opacity-40">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground hidden 2xl:table-cell">
                            {t.tieneColacion ? clp(Math.round(Number(t.montoColacion ?? 0) * ((movs[t.id]?.diasTrabajados ?? 30) / 30))) : <span className="opacity-40">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm hidden xl:table-cell">
                            {liq ? clp(liq.imponible) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-sm font-semibold">
                            {liq ? clp(liq.liquido) : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-2 py-2 hidden lg:table-cell">
                            {liq
                              ? <Badge variant={liq.pagada ? 'default' : 'secondary'} className="text-xs">{liq.pagada ? 'Pagada' : 'Calculada'}</Badge>
                              : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="sticky right-0 bg-card px-1 py-1.5 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] z-10">
                            <div className="flex items-center gap-0.5">
                              <Button size="sm" variant={isDirty ? 'default' : 'outline'} className="h-7 px-2"
                                onClick={() => calcularUno(t.id, liq)} disabled={isProc} title="Calcular">
                                {isProc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                              </Button>
                              {liq && <>
                                {!liq.pagada && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600"
                                    onClick={() => pagarLiq.mutate(liq.id)} title="Marcar pagada">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  onClick={() => abrirPdfLiquidacion(liq)} title="Ver e Imprimir liquidación">
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-blue-600"
                                  onClick={() => enviarEmailLiquidacion(liq, t)} title="Enviar por correo"
                                  disabled={enviandoEmail.has(liq.id)}>
                                  {enviandoEmail.has(liq.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteLiq.mutate(liq.id)} title="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}

      {/* VISTA LIBRO DE REMUNERACIONES */}
      {vista === 'libro' && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm">
              {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-20 h-8 text-sm" min="2000" max="2100" />
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={descargarLRE} disabled={liquidaciones.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />LRE / DT
              </Button>
              <Button variant="outline" size="sm" onClick={descargarPrevired} disabled={liquidaciones.length === 0}>
                <Download className="mr-1.5 h-3.5 w-3.5" />Previred
              </Button>
              <Button variant="outline" size="sm" onClick={() => abrirLibroRemuneraciones()} disabled={liquidaciones.length === 0}>
                <Printer className="mr-1.5 h-3.5 w-3.5" />Imprimir
              </Button>
            </div>
          </div>

          {loadingLiq ? (
            <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : liquidaciones.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">Sin liquidaciones en {MESES[mes - 1]} {anio}</p>
              <p className="text-xs text-muted-foreground mt-1">Calculá las liquidaciones del período en la pestaña Liquidaciones.</p>
            </CardContent></Card>
          ) : (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/50">
                <div>
                  <p className="font-semibold text-sm">Libro de Remuneraciones — {MESES[mes - 1]} {anio}</p>
                  <p className="text-xs text-muted-foreground">{empresa.razonSocial} · RUT: {empresa.rut} · {liquidaciones.length} trabajador(es)</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b text-[10px]">
                      <th className="px-2 py-2 text-center font-medium text-muted-foreground whitespace-nowrap">N°</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">RUT</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Trabajador</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">AFP</th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Salud</th>
                      <th className="px-2 py-2 text-center font-medium text-muted-foreground whitespace-nowrap">Días</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">Sueldo base</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">H.Extra</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Bono</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Gratif.</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell">Mov.</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden xl:table-cell">Col.</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">No Imp.</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">Imponible</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">Cotiz.AFP</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">SIS</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">Salud</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">CES</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden lg:table-cell">Imp.Único</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden sm:table-cell">Tot.Desc.</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Anticipo</th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground whitespace-nowrap font-semibold">Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liqs.map((l, i) => {
                      const noImp = Number(l.movilizacion ?? 0) + Number(l.colacion ?? 0);
                      const totDesc = Number(l.cotizAfp) + Number(l.cotizSis ?? 0) + Number(l.cotizSalud) + Number(l.cotizCes ?? 0) + Number(l.impuestoUnico ?? 0);
                      return (
                        <tr key={l.id} className={`border-b last:border-0 transition-colors text-xs ${i % 2 === 0 ? '' : 'bg-muted/10'} hover:bg-primary/5`}>
                          <td className="px-2 py-1.5 text-center text-muted-foreground">{i + 1}</td>
                          <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{l.trabajador?.rut ?? '—'}</td>
                          <td className="px-2 py-1.5 font-medium whitespace-nowrap">{l.trabajador?.nombre ?? '—'}</td>
                          <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">{l.trabajador?.afp ?? '—'}</td>
                          <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap hidden lg:table-cell">{l.trabajador?.salud ?? '—'}</td>
                          <td className="px-2 py-1.5 text-center">{l.diasTrabajados ?? 30}</td>
                          <td className="px-2 py-1.5 text-right font-mono">{clp(l.sueldoBase ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden md:table-cell">{clp(l.horasExtra ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden md:table-cell">{clp(l.bono ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden md:table-cell">{clp(l.gratificacion ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden xl:table-cell">{clp(l.movilizacion ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden xl:table-cell">{clp(l.colacion ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden md:table-cell">{clp(noImp)}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-semibold">{clp(l.imponible)}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-destructive hidden sm:table-cell">{clp(l.cotizAfp)}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-destructive hidden lg:table-cell">{clp(l.cotizSis ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-destructive hidden sm:table-cell">{clp(l.cotizSalud)}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-destructive hidden lg:table-cell">{clp(l.cotizCes ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono text-destructive hidden lg:table-cell">{clp(l.impuestoUnico ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-semibold text-destructive hidden sm:table-cell">{clp(totDesc)}</td>
                          <td className="px-2 py-1.5 text-right font-mono hidden md:table-cell">{clp(l.anticipo ?? 0)}</td>
                          <td className="px-2 py-1.5 text-right font-mono font-bold text-green-700">{clp(l.liquido)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 border-t-2 font-semibold text-xs">
                      <td colSpan={6} className="px-2 py-2 text-right text-muted-foreground uppercase tracking-wide">Totales</td>
                      <td className="px-2 py-2 text-right font-mono">{clp(libroTots.sueldo)}</td>
                      <td className="px-2 py-2 text-right font-mono hidden md:table-cell">{clp(libroTots.horasExtra)}</td>
                      <td className="px-2 py-2 text-right font-mono hidden md:table-cell">{clp(libroTots.bono)}</td>
                      <td className="px-2 py-2 text-right font-mono hidden md:table-cell">{clp(libroTots.gratif)}</td>
                      <td className="px-2 py-2 hidden xl:table-cell" />
                      <td className="px-2 py-2 hidden xl:table-cell" />
                      <td className="px-2 py-2 text-right font-mono hidden md:table-cell">{clp(libroTots.noImponible)}</td>
                      <td className="px-2 py-2 text-right font-mono">{clp(libroTots.imponible)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden sm:table-cell">{clp(libroTots.cotizAfp)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden lg:table-cell">{clp(libroTots.cotizSis)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden sm:table-cell">{clp(libroTots.cotizSalud)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden lg:table-cell">{clp(libroTots.cotizCes)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden lg:table-cell">{clp(libroTots.impuesto)}</td>
                      <td className="px-2 py-2 text-right font-mono text-destructive hidden sm:table-cell">{clp(libroTots.descuentos)}</td>
                      <td className="px-2 py-2 text-right font-mono hidden md:table-cell">{clp(libroTots.anticipo)}</td>
                      <td className="px-2 py-2 text-right font-mono font-bold text-green-700">{clp(libroTots.liquido)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA PERMISOS */}
      {vista === 'permisos' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold">Permisos Especiales</h2>
              <p className="text-xs text-muted-foreground">Art. 66, 207 bis CT — Ley 20.830</p>
            </div>
            <Button size="sm" onClick={() => setOpenPermiso(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Registrar Permiso
            </Button>
          </div>

          <Card className="mb-4">
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b bg-muted/40 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historial de Permisos</span>
                {filtroPermTrab !== 'todos' && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFiltroPermTrab('todos')}>
                    Ver todos ×
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Trabajador</th>
                      <th className="px-4 py-2 text-left font-medium">Tipo</th>
                      <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Fechas</th>
                      <th className="px-4 py-2 text-right font-medium">Días háb.</th>
                      <th className="px-4 py-2 text-center font-medium">Goce</th>
                      <th className="px-4 py-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(permData?.data ?? [])
                      .filter((p: Permiso) => filtroPermTrab === 'todos' || p.trabajadorId === filtroPermTrab)
                      .map((p: Permiso) => (
                        <tr
                          key={p.id}
                          className="border-b hover:bg-muted/10 cursor-pointer"
                          onClick={() => setFiltroPermTrab(filtroPermTrab === p.trabajadorId ? 'todos' : p.trabajadorId)}
                        >
                          <td className="px-4 py-2">
                            <div className="font-medium">{p.trabajador?.nombre ?? '—'}</div>
                            <div className="text-xs text-muted-foreground">{p.trabajador?.rut ?? ''}</div>
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary" className="text-xs whitespace-nowrap">{TIPO_PERMISO_LABELS[p.tipo] ?? p.tipo}</Badge>
                            {p.parentesco && <div className="text-xs text-muted-foreground mt-0.5">Parentesco: {p.parentesco}</div>}
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell text-muted-foreground">
                            {new Date(p.fechaInicio.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')} – {new Date(p.fechaFin.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">{p.diasHabiles}</td>
                          <td className="px-4 py-2 text-center">
                            <Badge variant={p.conGoce ? 'default' : 'destructive'} className="text-xs">{p.conGoce ? 'Con goce' : 'Sin goce'}</Badge>
                          </td>
                          <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => abrirComprobantePermiso(p.id)}>
                                <FileText className="h-3 w-3 mr-1" />Comprobante
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Eliminar este permiso?')) deletePerm.mutate(p.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {(permData?.data ?? []).filter((p: Permiso) => filtroPermTrab === 'todos' || p.trabajadorId === filtroPermTrab).length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin permisos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Dialog open={openPermiso} onOpenChange={(o) => { setOpenPermiso(o); if (!o) { formPerm.reset({ tipo: 'MATRIMONIO', conGoce: true }); createPerm.reset(); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Permiso Especial</DialogTitle>
                <DialogDescription>Art. 66, 207 bis CT y Ley 20.830 — Registro formal de permiso.</DialogDescription>
              </DialogHeader>
              <form onSubmit={formPerm.handleSubmit(onSubmitPermiso)} className="space-y-4 pt-2">
                <div>
                  <Label>Trabajador</Label>
                  <Controller
                    control={formPerm.control}
                    name="trabajadorId"
                    render={({ field }) => (
                      <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                        <option value="">Seleccionar trabajador…</option>
                        {todosLosTrabajadores.filter(t => t.activo).map(t => (
                          <option key={t.id} value={t.id}>{t.nombre} — {t.rut}</option>
                        ))}
                      </select>
                    )}
                  />
                  {formPerm.formState.errors.trabajadorId && <p className="text-xs text-red-500 mt-1">{formPerm.formState.errors.trabajadorId.message}</p>}
                </div>
                <div>
                  <Label>Tipo de permiso</Label>
                  <Controller
                    control={formPerm.control}
                    name="tipo"
                    render={({ field }) => (
                      <select
                        {...field}
                        className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                        onChange={(e) => {
                          field.onChange(e);
                          const val = e.target.value;
                          formPerm.setValue('conGoce', CON_GOCE_PERMISO[val] ?? true);
                        }}
                      >
                        {Object.entries(TIPO_PERMISO_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    )}
                  />
                </div>
                {DIAS_LEGALES_PERMISO[watchPermTipo] && (
                  <div className="border rounded-md px-3 py-2 text-xs bg-blue-50 border-blue-200 text-blue-800">
                    La ley otorga <strong>{DIAS_LEGALES_PERMISO[watchPermTipo]}</strong> días hábiles con goce para este tipo de permiso.
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Controller
                      control={formPerm.control}
                      name="fechaInicio"
                      render={({ field }) => (
                        <Input type="date" className="mt-1" value={field.value ? String(field.value).slice(0, 10) : ''} onChange={e => field.onChange(e.target.value)} />
                      )}
                    />
                    {formPerm.formState.errors.fechaInicio && <p className="text-xs text-red-500 mt-1">Requerida</p>}
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Controller
                      control={formPerm.control}
                      name="fechaFin"
                      render={({ field }) => (
                        <Input type="date" className="mt-1" value={field.value ? String(field.value).slice(0, 10) : ''} onChange={e => field.onChange(e.target.value)} />
                      )}
                    />
                    {formPerm.formState.errors.fechaFin && <p className="text-xs text-red-500 mt-1">{formPerm.formState.errors.fechaFin.message}</p>}
                  </div>
                </div>
                {fechasPermValidas && (
                  <div className={`border rounded-md px-3 py-2 text-sm font-medium ${diasHabilesPermCalc > 0 ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    {diasHabilesPermCalc > 0
                      ? <>Días hábiles del período: <span className="text-lg font-bold">{diasHabilesPermCalc}</span></>
                      : 'El período cae en fin de semana — se registra igual, pero no generará descuento salarial.'}
                  </div>
                )}
                {!fechasPermValidas && !watchPermFechaInicio && (
                  <p className="text-xs text-muted-foreground">Completá las fechas para continuar.</p>
                )}
                <div className="flex items-center gap-2">
                  <Controller
                    control={formPerm.control}
                    name="conGoce"
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="conGoce"
                        checked={field.value}
                        onChange={e => field.onChange(e.target.checked)}
                        className="h-4 w-4 accent-primary"
                      />
                    )}
                  />
                  <Label htmlFor="conGoce" className="cursor-pointer">Con goce de sueldo</Label>
                </div>
                {!watchPermConGoce && (
                  <div className="border rounded-md px-3 py-2 text-xs bg-orange-50 border-orange-200 text-orange-800">
                    Atención: este permiso descontará días del sueldo del mes correspondiente.
                  </div>
                )}
                {watchPermTipo === 'FALLECIMIENTO' && (
                  <div>
                    <Label>Parentesco</Label>
                    <Input {...formPerm.register('parentesco')} className="mt-1" placeholder="Ej: cónyuge, hijo, padre…" />
                  </div>
                )}
                <div>
                  <Label>Observación (opcional)</Label>
                  <Input {...formPerm.register('observacion')} className="mt-1" placeholder="Observaciones adicionales…" />
                </div>
                {createPerm.error && <p className="text-xs text-red-500">{createPerm.error.message}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={createPerm.isPending || !fechasPermValidas}>
                    {createPerm.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Registrar Permiso
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* VISTA VACACIONES */}
      {vista === 'vacaciones' && (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold">Registro de Vacaciones</h2>
              <p className="text-xs text-muted-foreground">Feriado anual Art. 67 CT — 15 días hábiles por año</p>
            </div>
            <Button size="sm" onClick={() => setOpenVacacion(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />Registrar Feriado
            </Button>
          </div>

          {/* SALDOS POR TRABAJADOR */}
          <Card className="mb-4">
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b bg-muted/40">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saldo por Trabajador</span>
              </div>
              {loadingSaldos ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                        <th className="px-4 py-2 text-left font-medium">Trabajador</th>
                        <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Ingreso</th>
                        <th className="px-4 py-2 text-right font-medium">Años</th>
                        <th className="px-4 py-2 text-right font-medium">Ganados</th>
                        <th className="px-4 py-2 text-right font-medium">Usados</th>
                        <th className="px-4 py-2 text-right font-medium font-bold">Saldo</th>
                        <th className="px-4 py-2 text-right font-medium hidden md:table-cell">Prog.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(saldosData?.data ?? []).map((s: VacacionSaldo) => (
                        <tr key={s.trabajadorId} className="border-b hover:bg-muted/10 cursor-pointer" onClick={() => setFiltroVacTrab(filtroVacTrab === s.trabajadorId ? 'todos' : s.trabajadorId)}>
                          <td className="px-4 py-2">
                            <div className="font-medium">{s.trabajadorNombre}</div>
                            <div className="text-xs text-muted-foreground">{s.trabajadorRut}</div>
                          </td>
                          <td className="px-4 py-2 hidden md:table-cell text-muted-foreground">{new Date(s.fechaIngreso.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')}</td>
                          <td className="px-4 py-2 text-right">{s.aniosServicio.toFixed(1)}</td>
                          <td className="px-4 py-2 text-right">{s.diasGanados}</td>
                          <td className="px-4 py-2 text-right text-orange-600">{s.diasUsados}</td>
                          <td className={`px-4 py-2 text-right font-bold ${s.saldo <= 0 ? 'text-red-600' : 'text-green-700'}`}>{s.saldo}</td>
                          <td className="px-4 py-2 text-right hidden md:table-cell text-blue-600">{s.diasProgresivos > 0 ? `+${s.diasProgresivos}` : '—'}</td>
                        </tr>
                      ))}
                      {(saldosData?.data ?? []).length === 0 && (
                        <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin trabajadores activos</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* HISTORIAL */}
          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b bg-muted/40 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Historial de Feriados</span>
                {filtroVacTrab !== 'todos' && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setFiltroVacTrab('todos')}>
                    Ver todos ×
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20 text-xs text-muted-foreground">
                      <th className="px-4 py-2 text-left font-medium">Trabajador</th>
                      <th className="px-4 py-2 text-left font-medium">Período</th>
                      <th className="px-4 py-2 text-right font-medium">Días háb.</th>
                      <th className="px-4 py-2 text-left font-medium hidden md:table-cell">Tipo</th>
                      <th className="px-4 py-2 text-right font-medium hidden md:table-cell">Saldo ant.</th>
                      <th className="px-4 py-2 text-right font-medium hidden md:table-cell">Saldo post.</th>
                      <th className="px-4 py-2 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vacData?.data ?? [])
                      .filter(v => filtroVacTrab === 'todos' || v.trabajadorId === filtroVacTrab)
                      .map(v => (
                        <tr key={v.id} className="border-b hover:bg-muted/10">
                          <td className="px-4 py-2">
                            <div className="font-medium">{(v.trabajador as { nombre?: string })?.nombre ?? '—'}</div>
                          </td>
                          <td className="px-4 py-2">
                            <div>{new Date(v.fechaInicio.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')} – {new Date(v.fechaFin.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CL')}</div>
                            {v.periodoAnual && (
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <Badge variant="secondary" className="text-xs">{v.periodoAnual.split('·')[0]?.trim()}</Badge>
                                {(() => {
                                  const s = periodoStatusMap.get(`${v.trabajadorId}|||${v.periodoAnual}`);
                                  if (!s) return null;
                                  const restantes = Math.max(0, s.derecho - s.usados);
                                  const agotado = s.usados >= s.derecho;
                                  return (
                                    <span className={`text-xs font-medium ${agotado ? 'text-red-600' : 'text-green-700'}`}>
                                      {agotado ? `Agotado (${s.usados}/${s.derecho})` : `${restantes} días disponibles`}
                                    </span>
                                  );
                                })()}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">{v.diasHabiles}</td>
                          <td className="px-4 py-2 hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">{v.tipo}</Badge>
                          </td>
                          <td className="px-4 py-2 text-right hidden md:table-cell">{Number(v.saldoPrevio)}</td>
                          <td className="px-4 py-2 text-right hidden md:table-cell font-medium text-green-700">{Number(v.saldoPosterior)}</td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => abrirComprobanteFeriado(v.id)}>
                                <FileText className="h-3 w-3 mr-1" />Comprobante
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => { if (confirm('¿Eliminar este registro de feriado?')) deleteVac.mutate(v.id); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {(vacData?.data ?? []).filter(v => filtroVacTrab === 'todos' || v.trabajadorId === filtroVacTrab).length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Sin feriados registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* DIALOG REGISTRAR FERIADO */}
          <Dialog open={openVacacion} onOpenChange={(o) => { setOpenVacacion(o); if (!o) { formVac.reset({ tipo: 'NORMAL' }); createVac.reset(); } }}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registrar Feriado Legal</DialogTitle>
                <DialogDescription>Art. 67 CT — El período se cuenta en días hábiles (lunes a viernes).</DialogDescription>
              </DialogHeader>
              <form onSubmit={formVac.handleSubmit(onSubmitVac)} className="space-y-4 pt-2">
                <div>
                  <Label>Trabajador</Label>
                  <Controller
                    control={formVac.control}
                    name="trabajadorId"
                    render={({ field }) => (
                      <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                        <option value="">Seleccionar trabajador…</option>
                        {todosLosTrabajadores.filter(t => t.activo).map(t => (
                          <option key={t.id} value={t.id}>{t.nombre} — {t.rut}</option>
                        ))}
                      </select>
                    )}
                  />
                  {formVac.formState.errors.trabajadorId && <p className="text-xs text-red-500 mt-1">{formVac.formState.errors.trabajadorId.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Fecha inicio</Label>
                    <Controller
                      control={formVac.control}
                      name="fechaInicio"
                      render={({ field }) => (
                        <Input type="date" className="mt-1" value={field.value ? String(field.value).slice(0, 10) : ''} onChange={e => field.onChange(e.target.value)} />
                      )}
                    />
                    {formVac.formState.errors.fechaInicio && <p className="text-xs text-red-500 mt-1">Requerida</p>}
                  </div>
                  <div>
                    <Label>Fecha fin</Label>
                    <Controller
                      control={formVac.control}
                      name="fechaFin"
                      render={({ field }) => (
                        <Input type="date" className="mt-1" value={field.value ? String(field.value).slice(0, 10) : ''} onChange={e => field.onChange(e.target.value)} />
                      )}
                    />
                    {formVac.formState.errors.fechaFin && <p className="text-xs text-red-500 mt-1">{formVac.formState.errors.fechaFin.message}</p>}
                  </div>
                </div>
                {diasHabilesCalc > 0 && (() => {
                  const saldoTrab = (saldosData?.data ?? []).find(s => s.trabajadorId === watchTrabId)?.saldo ?? 0;
                  const insuficiente = diasHabilesCalc > saldoTrab;
                  return (
                    <div className={`border rounded-md px-3 py-2 text-sm font-medium ${insuficiente ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                      Días hábiles del período: <span className="text-lg font-bold">{diasHabilesCalc}</span>
                      {insuficiente && <span className="block text-xs mt-0.5">⚠️ Saldo insuficiente — el trabajador tiene <strong>{saldoTrab}</strong> días disponibles</span>}
                    </div>
                  );
                })()}
                <div>
                  <Label>Período anual compensado</Label>
                  <Controller
                    control={formVac.control}
                    name="periodoAnual"
                    render={({ field }) => (
                      <select {...field} value={field.value ?? ''} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                        <option value="">Seleccionar período…</option>
                        {periodosDisponibles.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    )}
                  />
                  {formVac.formState.errors.periodoAnual && <p className="text-xs text-red-500 mt-1">{formVac.formState.errors.periodoAnual.message}</p>}
                </div>
                <div>
                  <Label>Tipo de feriado</Label>
                  <Controller
                    control={formVac.control}
                    name="tipo"
                    render={({ field }) => (
                      <select {...field} className="w-full border rounded-md px-3 py-2 text-sm mt-1">
                        <option value="NORMAL">Feriado Legal (Art. 67)</option>
                        <option value="PROGRESIVO">Feriado Progresivo (Art. 68)</option>
                        <option value="COLECTIVO">Feriado Colectivo (Art. 76)</option>
                      </select>
                    )}
                  />
                </div>
                <div>
                  <Label>Observación (opcional)</Label>
                  <Input {...formVac.register('observacion')} className="mt-1" placeholder="Ej: acuerdo con trabajador, feriado fraccionado…" />
                </div>
                {createVac.error && <p className="text-xs text-red-500">{createVac.error.message}</p>}
                <DialogFooter>
                  <Button type="submit" disabled={createVac.isPending || diasHabilesCalc === 0}>
                    {createVac.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Registrar Feriado
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
