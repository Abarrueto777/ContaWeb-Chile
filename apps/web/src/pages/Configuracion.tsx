import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Building2, Calculator, RefreshCw, UserCheck, CheckCircle, Briefcase } from 'lucide-react';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { useUpsertValorUF, useValorUFMes } from '@/hooks/useUF';
import { useConfigEmpresa, useUpdateConfigEmpresa } from '@/hooks/useConfigEmpresa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

type UFForm = {
  uf: number; utm: number; imm: number;
  afpCapital: number; afpCuprum: number; afpHabitat: number; afpPlanvital: number;
  afpProvida: number; afpModelo: number; afpUno: number;
};

export default function Configuracion() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [savedEmpresa, setSavedEmpresa] = useState(false);
  const [savedUF, setSavedUF] = useState(false);
  const [fetchingUF, setFetchingUF] = useState(false);

  const { empresa, isLoading } = useEmpresaActual();
  const qc = useQueryClient();
  const upsertUF = useUpsertValorUF();

  const [savedRRHH, setSavedRRHH] = useState(false);
  const { data: configData } = useConfigEmpresa(empresa?.id ?? '');
  const updateConfig = useUpdateConfigEmpresa(empresa?.id ?? '');

  type RRHHConfigForm = {
    iva_pct: number;
    ppm_pct: number;
    tasa_1cat_pct: number;
    tope_cotiz_uf: number;
    tope_se_uf: number;
    sis_pct: number;
    ces_trabajador_pct: number;
    ces_empleador_pct: number;
    acc_laboral_pct: number;
    aporte_ses_pct: number;
    horas_semanales: number;
    movilizacion_mensual: number;
    colacion_mensual: number;
  };

  const { register: regRRHH, handleSubmit: handleRRHH, setValue: setRRHHValue } = useForm<RRHHConfigForm>({
    defaultValues: {
      iva_pct: 0.19,
      ppm_pct: 0.002,
      tasa_1cat_pct: 0.25,
      tope_cotiz_uf: 81.6,
      tope_se_uf: 75.0,
      sis_pct: 0.0143,
      ces_trabajador_pct: 0.006,
      ces_empleador_pct: 0.024,
      acc_laboral_pct: 0.0034,
      aporte_ses_pct: 0.0003,
      horas_semanales: 42,
      movilizacion_mensual: 0,
      colacion_mensual: 0,
    },
  });

  const empresaFormOpts = empresa ? {
    values: {
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      giro: empresa.giro,
      ...(empresa.actividadEconomica ? { actividadEconomica: empresa.actividadEconomica } : {}),
      ...(empresa.direccion ? { direccion: empresa.direccion } : {}),
      ...(empresa.telefono ? { telefono: empresa.telefono } : {}),
      ...(empresa.email ? { email: empresa.email } : {}),
      ...(empresa.representanteLegal ? { representanteLegal: empresa.representanteLegal } : {}),
      ...(empresa.rutRepresentante ? { rutRepresentante: empresa.rutRepresentante } : {}),
      ...(empresa.tasaRetencionHon != null ? { tasaRetencionHon: empresa.tasaRetencionHon } : {}),
    } as EmpresaInput,
  } : {};

  const { register: regEmpresa, handleSubmit: handleEmpresa, formState: { errors: errEmpresa, isSubmitting: savingEmpresa } } = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    ...empresaFormOpts,
  });

  const { data: ufData, isLoading: loadingUF } = useValorUFMes(anio, mes);

  const { register: regUF, handleSubmit: handleUF, setValue: setUFValue, formState: { isSubmitting: savingUF } } = useForm<UFForm>({
    defaultValues: {
      uf: 0, utm: 0, imm: 0,
      afpCapital: 0.1144, afpCuprum: 0.1144, afpHabitat: 0.1127, afpPlanvital: 0.1127,
      afpProvida: 0.1145, afpModelo: 0.1077, afpUno: 0.1049,
    },
  });

  // Auto-carga valores desde la BD cuando cambia el mes/año
  useEffect(() => {
    if (ufData?.data) {
      const d = ufData.data;
      setUFValue('uf', Number(d.uf));
      setUFValue('utm', Number(d.utm));
      setUFValue('imm', Number(d.imm));
      if (d.afpCapital)   setUFValue('afpCapital',   Number(d.afpCapital));
      if (d.afpCuprum)    setUFValue('afpCuprum',    Number(d.afpCuprum));
      if (d.afpHabitat)   setUFValue('afpHabitat',   Number(d.afpHabitat));
      if (d.afpPlanvital) setUFValue('afpPlanvital', Number(d.afpPlanvital));
      if (d.afpProvida)   setUFValue('afpProvida',   Number(d.afpProvida));
      if (d.afpModelo)    setUFValue('afpModelo',    Number(d.afpModelo));
      if (d.afpUno)       setUFValue('afpUno',       Number(d.afpUno));
    }
  }, [ufData, setUFValue]);

  // Carga config RRHH desde la BD cuando llegan datos
  useEffect(() => {
    if (!configData?.data) return;
    const c = configData.data;
    if (c['iva_pct'] !== undefined) setRRHHValue('iva_pct', Number(c['iva_pct']));
    if (c['ppm_pct'] !== undefined) setRRHHValue('ppm_pct', Number(c['ppm_pct']));
    if (c['tasa_1cat_pct'] !== undefined) setRRHHValue('tasa_1cat_pct', Number(c['tasa_1cat_pct']));
    if (c['tope_cotiz_uf'] !== undefined) setRRHHValue('tope_cotiz_uf', Number(c['tope_cotiz_uf']));
    if (c['tope_se_uf'] !== undefined) setRRHHValue('tope_se_uf', Number(c['tope_se_uf']));
    if (c['sis_pct'] !== undefined) setRRHHValue('sis_pct', Number(c['sis_pct']));
    if (c['ces_trabajador_pct'] !== undefined) setRRHHValue('ces_trabajador_pct', Number(c['ces_trabajador_pct']));
    if (c['ces_empleador_pct'] !== undefined) setRRHHValue('ces_empleador_pct', Number(c['ces_empleador_pct']));
    if (c['acc_laboral_pct'] !== undefined) setRRHHValue('acc_laboral_pct', Number(c['acc_laboral_pct']));
    if (c['aporte_ses_pct'] !== undefined) setRRHHValue('aporte_ses_pct', Number(c['aporte_ses_pct']));
    if (c['horas_semanales'] !== undefined) setRRHHValue('horas_semanales', Number(c['horas_semanales']));
    if (c['movilizacion_mensual'] !== undefined) setRRHHValue('movilizacion_mensual', Number(c['movilizacion_mensual']));
    if (c['colacion_mensual'] !== undefined) setRRHHValue('colacion_mensual', Number(c['colacion_mensual']));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configData]);

  // Auto-sincroniza desde mindicador.cl si el mes actual no tiene datos
  useEffect(() => {
    if (loadingUF) return;
    const hoy = new Date();
    const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
    if (!esMesActual) return;
    if (ufData?.data) return;
    syncDesdeMindicador();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUF, ufData, anio, mes]);

  async function onSaveEmpresa(data: EmpresaInput) {
    if (!empresa) return;
    await api.put(`/api/empresas/${empresa.id}`, data);
    qc.invalidateQueries({ queryKey: ['empresas'] });
    setSavedEmpresa(true);
    setTimeout(() => setSavedEmpresa(false), 2000);
  }

  function onSaveUF(data: UFForm) {
    upsertUF.mutate({ anio, mes, ...data }, {
      onSuccess: () => { setSavedUF(true); setTimeout(() => setSavedUF(false), 2000); },
    });
  }

  async function syncDesdeMindicador() {
    setFetchingUF(true);
    try {
      const res = await api.post<{ data: UFForm }>(`/api/uf/sync/${anio}/${mes}/forzar`);
      const { uf, utm, imm } = res.data.data;
      if (uf) setUFValue('uf', Number(uf));
      if (utm) setUFValue('utm', Number(utm));
      if (imm) setUFValue('imm', Number(imm));
      qc.invalidateQueries({ queryKey: ['uf', anio, mes] });
    } catch {
      // silencioso
    } finally {
      setFetchingUF(false);
    }
  }

  function onSaveRRHH(data: RRHHConfigForm) {
    const payload: Record<string, string> = {};
    (Object.keys(data) as (keyof RRHHConfigForm)[]).forEach(k => {
      payload[k] = String(data[k]);
    });
    updateConfig.mutate(payload, {
      onSuccess: () => { setSavedRRHH(true); setTimeout(() => setSavedRRHH(false), 2000); },
    });
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Cargando…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tenés empresas registradas</p></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
      </div>

      {/* Datos empresa */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />Datos de la empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmpresa(onSaveEmpresa)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>RUT *</Label>
                <Input {...regEmpresa('rut')} placeholder="76.123.456-7" />
                {errEmpresa.rut && <p className="text-xs text-destructive">{errEmpresa.rut.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Razón Social *</Label>
                <Input {...regEmpresa('razonSocial')} />
                {errEmpresa.razonSocial && <p className="text-xs text-destructive">{errEmpresa.razonSocial.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Giro *</Label>
                <Input {...regEmpresa('giro')} />
                {errEmpresa.giro && <p className="text-xs text-destructive">{errEmpresa.giro.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Actividad económica (SII)</Label>
                <Input {...regEmpresa('actividadEconomica')} placeholder="Código actividad" />
              </div>
              <div className="space-y-1.5">
                <Label>Dirección</Label>
                <Input {...regEmpresa('direccion')} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input {...regEmpresa('telefono')} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Email</Label>
                <Input {...regEmpresa('email')} type="email" />
              </div>
            </div>
            <Button type="submit" disabled={savingEmpresa}>
              {savingEmpresa ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedEmpresa ? 'Guardado ✓' : 'Guardar datos'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Representante legal */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />Representante legal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmpresa(onSaveEmpresa)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input {...regEmpresa('representanteLegal')} placeholder="Juan Pérez González" />
              </div>
              <div className="space-y-1.5">
                <Label>RUT representante</Label>
                <Input {...regEmpresa('rutRepresentante')} placeholder="12.345.678-9" />
                {errEmpresa.rutRepresentante && <p className="text-xs text-destructive">{errEmpresa.rutRepresentante.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5 max-w-xs">
              <Label>Tasa retención honorarios (%)</Label>
              <Input {...regEmpresa('tasaRetencionHon', { valueAsNumber: true })} type="number" step="0.01" min="0" max="100" placeholder="10.75" />
              <p className="text-xs text-muted-foreground">Por defecto 10.75% (Art. 74 LIR)</p>
            </div>
            <Button type="submit" disabled={savingEmpresa}>
              {savingEmpresa ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedEmpresa ? 'Guardado ✓' : 'Guardar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Valores UF/UTM/IMM */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />Valores UF / UTM / IMM
            {ufData?.data && (
              <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />Cargado desde BD
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUF(onSaveUF)} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
              <Button type="button" variant="outline" size="sm" onClick={syncDesdeMindicador} disabled={fetchingUF || loadingUF}>
                {fetchingUF ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                Sincronizar mindicador.cl
              </Button>
            </div>
            {loadingUF ? (
              <div className="h-20 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />Cargando valores del período…
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>UF del mes ($)</Label>
                  <Input {...regUF('uf', { valueAsNumber: true })} type="number" step="0.01" />
                </div>
                <div className="space-y-1.5">
                  <Label>UTM del mes ($)</Label>
                  <Input {...regUF('utm', { valueAsNumber: true })} type="number" />
                </div>
                <div className="space-y-1.5">
                  <Label>IMM del mes ($)</Label>
                  <Input {...regUF('imm', { valueAsNumber: true })} type="number" />
                </div>
              </div>
            )}
            {/* Tasas AFP mensuales — se copian de previred.com */}
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tasas AFP del mes (tasa trabajador, sin SIS) — copiá de previred.com
              </p>
              <div className="grid sm:grid-cols-4 gap-3">
                {[
                  { key: 'afpCapital' as const,   label: 'Capital' },
                  { key: 'afpCuprum' as const,    label: 'Cuprum' },
                  { key: 'afpHabitat' as const,   label: 'Hábitat' },
                  { key: 'afpPlanvital' as const, label: 'PlanVital' },
                  { key: 'afpProvida' as const,   label: 'ProVida' },
                  { key: 'afpModelo' as const,    label: 'Modelo' },
                  { key: 'afpUno' as const,       label: 'Uno' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input {...regUF(key, { valueAsNumber: true })} type="number" step="0.0001" min="0" max="0.5" className="h-8 text-sm" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Expresadas como decimal (ej.: 0.1127 = 11.27%). Las tasas AFP cambian anualmente — revisá en previred.com cada enero.
              </p>
            </div>
            <Button type="submit" disabled={savingUF || upsertUF.isPending || loadingUF}>
              {(savingUF || upsertUF.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedUF ? 'Guardado ✓' : 'Guardar valores'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Configuración RRHH */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="h-4 w-4" />Configuración RRHH
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRRHH(onSaveRRHH)} className="space-y-6">

            {/* Impuestos y Tasas Tributarias */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Impuestos y Tasas Tributarias</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>IVA (%)</Label>
                  <Input {...regRRHH('iva_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Impuesto al Valor Agregado. Valor actual: 19%</p>
                </div>
                <div className="space-y-1.5">
                  <Label>PPM ProPyme (%)</Label>
                  <Input {...regRRHH('ppm_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Pago Provisional Mensual. Default: 0.2%</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Impuesto 1ª Categoría (%)</Label>
                  <Input {...regRRHH('tasa_1cat_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Tasa ProPyme. Default: 25%</p>
                </div>
              </div>
            </div>

            {/* Cotizaciones Previsionales */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cotizaciones Previsionales</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tope Imponible (UF)</Label>
                  <Input {...regRRHH('tope_cotiz_uf', { valueAsNumber: true })} type="number" step="0.1" min="0" />
                  <p className="text-xs text-muted-foreground">Tope máximo cotizaciones. Default: 81.6 UF</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Tope Sueldo Empresarial (UF)</Label>
                  <Input {...regRRHH('tope_se_uf', { valueAsNumber: true })} type="number" step="0.1" min="0" />
                  <p className="text-xs text-muted-foreground">Default: 75 UF</p>
                </div>
                <div className="space-y-1.5">
                  <Label>SIS Empleador (%)</Label>
                  <Input {...regRRHH('sis_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Seguro Invalidez y Sobrevivencia. Default: 1.43%</p>
                </div>
                <div className="space-y-1.5">
                  <Label>CES Trabajador (%)</Label>
                  <Input {...regRRHH('ces_trabajador_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Default: 0.6%</p>
                </div>
                <div className="space-y-1.5">
                  <Label>CES Empleador (%)</Label>
                  <Input {...regRRHH('ces_empleador_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Default: 2.4% indefinido / 3% plazo fijo</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Accidente Laboral (%)</Label>
                  <Input {...regRRHH('acc_laboral_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Cotización MUTUAL. Default: 0.34%</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Aporte SES (%)</Label>
                  <Input {...regRRHH('aporte_ses_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                  <p className="text-xs text-muted-foreground">Default: 0.03%</p>
                </div>
              </div>
            </div>

            {/* Jornada Laboral */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Jornada Laboral</h3>
              <div className="max-w-xs space-y-1.5">
                <Label>Horas semanales</Label>
                <Input {...regRRHH('horas_semanales', { valueAsNumber: true })} type="number" step="1" min="1" max="60" />
                <p className="text-xs text-muted-foreground">Ley 21.561. Default: 42 hrs</p>
              </div>
            </div>

            {/* Beneficios Laborales */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Beneficios Laborales (No Imponibles)</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Movilización mensual ($)</Label>
                  <Input {...regRRHH('movilizacion_mensual', { valueAsNumber: true })} type="number" step="1" min="0" />
                  <p className="text-xs text-muted-foreground">Monto mensual completo. Se prorratea por días trabajados. Se activa por trabajador en su ficha.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Colación mensual ($)</Label>
                  <Input {...regRRHH('colacion_mensual', { valueAsNumber: true })} type="number" step="1" min="0" />
                  <p className="text-xs text-muted-foreground">Monto mensual completo. Se prorratea por días trabajados. Se activa por trabajador en su ficha.</p>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedRRHH ? 'Guardado ✓' : 'Guardar configuración RRHH'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}
