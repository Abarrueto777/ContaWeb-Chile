import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save, Loader2, Building2, Calculator, RefreshCw,
  UserCheck, CheckCircle, Briefcase, Zap,
} from 'lucide-react';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { useUpsertValorUF, useValorUFMes, useSyncPrevired } from '@/hooks/useUF';
import { useConfigEmpresa, useUpdateConfigEmpresa } from '@/hooks/useConfigEmpresa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

type UFForm = {
  uf: number; utm: number; imm: number;
  afpCapital: number; afpCuprum: number; afpHabitat: number; afpPlanvital: number;
  afpProvida: number; afpModelo: number; afpUno: number;
  sisEmpleador: number; topeImponibleUf: number;
};

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

export default function Configuracion() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [savedEmpresa, setSavedEmpresa] = useState(false);
  const [savedUF, setSavedUF] = useState(false);
  const [savedRRHH, setSavedRRHH] = useState(false);
  const [fetchingUF, setFetchingUF] = useState(false);
  const [previredMsg, setPreviredMsg] = useState<string | null>(null);

  const { empresa, isLoading } = useEmpresaActual();
  const qc = useQueryClient();
  const upsertUF = useUpsertValorUF();

  const { data: configData } = useConfigEmpresa(empresa?.id ?? '');
  const updateConfig = useUpdateConfigEmpresa(empresa?.id ?? '');
  const syncPrevired = useSyncPrevired();

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

  const {
    register: regEmpresa,
    handleSubmit: handleEmpresa,
    formState: { errors: errEmpresa, isSubmitting: savingEmpresa },
  } = useForm<EmpresaInput>({ resolver: zodResolver(empresaSchema), ...empresaFormOpts });

  const { data: ufData, isLoading: loadingUF } = useValorUFMes(anio, mes);

  const {
    register: regUF,
    handleSubmit: handleUF,
    setValue: setUFValue,
    formState: { isSubmitting: savingUF },
  } = useForm<UFForm>({
    defaultValues: {
      uf: 0, utm: 0, imm: 0,
      afpCapital: 0.1144, afpCuprum: 0.1144, afpHabitat: 0.1127, afpPlanvital: 0.1127,
      afpProvida: 0.1145, afpModelo: 0.1077, afpUno: 0.1049,
      sisEmpleador: 0.0162, topeImponibleUf: 90.0,
    },
  });

  const {
    register: regRRHH,
    handleSubmit: handleRRHH,
    setValue: setRRHHValue,
  } = useForm<RRHHConfigForm>({
    defaultValues: {
      iva_pct: 0.19, ppm_pct: 0.002, tasa_1cat_pct: 0.25,
      tope_cotiz_uf: 81.6, tope_se_uf: 75.0,
      sis_pct: 0.0143, ces_trabajador_pct: 0.006, ces_empleador_pct: 0.024,
      acc_laboral_pct: 0.0034, aporte_ses_pct: 0.0003,
      horas_semanales: 42, movilizacion_mensual: 0, colacion_mensual: 0,
    },
  });

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
      if (d.sisEmpleador)    setUFValue('sisEmpleador',    Number(d.sisEmpleador));
      if (d.topeImponibleUf) setUFValue('topeImponibleUf', Number(d.topeImponibleUf));
    }
  }, [ufData, setUFValue]);

  useEffect(() => {
    if (!configData?.data) return;
    const c = configData.data;
    const set = (k: keyof RRHHConfigForm) => {
      if (c[k] !== undefined) setRRHHValue(k, Number(c[k]));
    };
    (['iva_pct','ppm_pct','tasa_1cat_pct','tope_cotiz_uf','tope_se_uf',
      'sis_pct','ces_trabajador_pct','ces_empleador_pct','acc_laboral_pct',
      'aporte_ses_pct','horas_semanales','movilizacion_mensual','colacion_mensual',
    ] as (keyof RRHHConfigForm)[]).forEach(set);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configData]);

  useEffect(() => {
    if (loadingUF) return;
    const hoy = new Date();
    const esMesActual = anio === hoy.getFullYear() && mes === hoy.getMonth() + 1;
    if (!esMesActual || ufData?.data) return;
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

  async function handleSyncPrevired() {
    setPreviredMsg(null);
    try {
      const res = await syncPrevired.mutateAsync();
      const d = res.data;
      const encontrado = (res as unknown as { _encontrado?: string[] })._encontrado ?? [];
      setUFValue('afpCapital',   Number(d.afpCapital));
      setUFValue('afpCuprum',    Number(d.afpCuprum));
      setUFValue('afpHabitat',   Number(d.afpHabitat));
      setUFValue('afpPlanvital', Number(d.afpPlanvital));
      setUFValue('afpProvida',   Number(d.afpProvida));
      setUFValue('afpModelo',    Number(d.afpModelo));
      setUFValue('afpUno',       Number(d.afpUno));
      if (d.uf)  setUFValue('uf',  Number(d.uf));
      if (d.utm) setUFValue('utm', Number(d.utm));
      if (d.imm) setUFValue('imm', Number(d.imm));
      const ts = d.previredSyncAt ? new Date(d.previredSyncAt).toLocaleString('es-CL') : '';
      if (encontrado.length > 0) {
        setPreviredMsg(`✓ Sincronizado ${ts} — encontrado: ${encontrado.join(', ')}`);
      } else {
        setPreviredMsg(`✓ Sincronizado ${ts}`);
      }
    } catch (e: unknown) {
      const errData = (e as { response?: { data?: { error?: string; _advertencias?: string[] } } })?.response?.data;
      if (errData?._advertencias?.length) {
        setPreviredMsg(`⚠ ${errData._advertencias.join(' ')}`);
      } else if (errData?.error) {
        setPreviredMsg(`⚠ ${errData.error}`);
      } else {
        setPreviredMsg('⚠ No se pudo conectar con previred.com. Ingresá las tasas manualmente y guardá.');
      }
    }
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
    (Object.keys(data) as (keyof RRHHConfigForm)[]).forEach(k => { payload[k] = String(data[k]); });
    updateConfig.mutate(payload, {
      onSuccess: () => { setSavedRRHH(true); setTimeout(() => setSavedRRHH(false), 2000); },
    });
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Cargando…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tenés empresas registradas</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
      </div>

      <Tabs defaultValue="empresa">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="empresa" className="gap-2">
            <Building2 className="h-4 w-4" />Empresa
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="gap-2">
            <Calculator className="h-4 w-4" />Indicadores
          </TabsTrigger>
          <TabsTrigger value="rrhh" className="gap-2">
            <Briefcase className="h-4 w-4" />RRHH
          </TabsTrigger>
        </TabsList>

        {/* ── TAB EMPRESA ── */}
        <TabsContent value="empresa" className="space-y-6 pt-4">

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

        </TabsContent>

        {/* ── TAB INDICADORES ── */}
        <TabsContent value="indicadores" className="space-y-6 pt-4">

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4" />Indicadores Previsionales del período
                {ufData?.data && (
                  <span className="ml-auto flex items-center gap-1 text-xs font-normal text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />Cargado desde BD
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUF(onSaveUF)} className="space-y-6">

                {/* Selector período + botones sync */}
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                  <Input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(Number(e.target.value))}
                    className="w-24"
                    min="2000"
                    max="2100"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={syncDesdeMindicador} disabled={fetchingUF || loadingUF}>
                    {fetchingUF ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                    Sincronizar mindicador.cl
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleSyncPrevired}
                    disabled={syncPrevired.isPending}
                  >
                    {syncPrevired.isPending
                      ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      : <Zap className="mr-1.5 h-3.5 w-3.5" />}
                    Sincronizar Previred
                  </Button>
                </div>

                {/* Mensaje sync Previred */}
                {previredMsg && (
                  <p className={`text-xs flex items-center gap-1 ${previredMsg.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
                    <CheckCircle className="h-3 w-3" />{previredMsg}
                  </p>
                )}

                {/* Última sync desde BD */}
                {ufData?.data?.previredSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Último sync Previred: {new Date(ufData.data.previredSyncAt).toLocaleString('es-CL')}
                  </p>
                )}

                {loadingUF ? (
                  <div className="h-20 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />Cargando valores del período…
                  </div>
                ) : (
                  <>
                    {/* UF / UTM / IMM */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Valores del mes
                      </p>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label>UF ($)</Label>
                          <Input {...regUF('uf', { valueAsNumber: true })} type="number" step="0.01" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>UTM ($)</Label>
                          <Input {...regUF('utm', { valueAsNumber: true })} type="number" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>IMM — Ingreso Mínimo ($)</Label>
                          <Input {...regUF('imm', { valueAsNumber: true })} type="number" />
                        </div>
                      </div>
                    </div>

                    {/* Tasas AFP */}
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Tasas AFP del mes (tasa trabajador, sin SIS)
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Copiá desde <span className="font-medium">previred.com → Indicadores → Tasas AFP</span>. Expresadas como decimal (ej.: 0.1127 = 11.27%). Cambian anualmente cada enero.
                      </p>
                      <div className="grid sm:grid-cols-4 gap-3">
                        {([
                          { key: 'afpCapital' as const,   label: 'Capital' },
                          { key: 'afpCuprum' as const,    label: 'Cuprum' },
                          { key: 'afpHabitat' as const,   label: 'Hábitat' },
                          { key: 'afpPlanvital' as const, label: 'PlanVital' },
                          { key: 'afpProvida' as const,   label: 'ProVida' },
                          { key: 'afpModelo' as const,    label: 'Modelo' },
                          { key: 'afpUno' as const,       label: 'Uno' },
                        ]).map(({ key, label }) => (
                          <div key={key} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input
                              {...regUF(key, { valueAsNumber: true })}
                              type="number"
                              step="0.0001"
                              min="0"
                              max="0.5"
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                    {/* SIS y tope imponible */}
                    <div className="border-t pt-4 grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>SIS Empleador</Label>
                        <Input {...regUF('sisEmpleador', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="0.2" />
                        <p className="text-xs text-muted-foreground">Seguro Invalidez y Sobrevivencia. Actual: 1.62%</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tope imponible AFP (UF)</Label>
                        <Input {...regUF('topeImponibleUf', { valueAsNumber: true })} type="number" step="0.1" min="0" />
                        <p className="text-xs text-muted-foreground">Renta tope cotizaciones AFP. Actual: 90 UF</p>
                      </div>
                    </div>

                <Button type="submit" disabled={savingUF || upsertUF.isPending || loadingUF}>
                  {(savingUF || upsertUF.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {savedUF ? 'Guardado ✓' : 'Guardar indicadores'}
                </Button>
              </form>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ── TAB RRHH ── */}
        <TabsContent value="rrhh" className="space-y-6 pt-4">

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />Parámetros de RRHH
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRRHH(onSaveRRHH)} className="space-y-6">

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Impuestos y tasas tributarias</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>IVA</Label>
                      <Input {...regRRHH('iva_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Actual: 19%</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>PPM ProPyme</Label>
                      <Input {...regRRHH('ppm_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Default: 0.2%</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Impuesto 1ª Categoría</Label>
                      <Input {...regRRHH('tasa_1cat_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">ProPyme: 25%</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cotizaciones previsionales</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Tope imponible (UF)</Label>
                      <Input {...regRRHH('tope_cotiz_uf', { valueAsNumber: true })} type="number" step="0.1" min="0" />
                      <p className="text-xs text-muted-foreground">Default: 81.6 UF</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tope sueldo empresarial (UF)</Label>
                      <Input {...regRRHH('tope_se_uf', { valueAsNumber: true })} type="number" step="0.1" min="0" />
                      <p className="text-xs text-muted-foreground">Default: 75 UF</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>SIS empleador</Label>
                      <Input {...regRRHH('sis_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Seguro Invalidez y Sobrevivencia. Default: 1.43%</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>CES trabajador</Label>
                      <Input {...regRRHH('ces_trabajador_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Default: 0.6%</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>CES empleador</Label>
                      <Input {...regRRHH('ces_empleador_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Default: 2.4% indefinido / 3% plazo fijo</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Accidente laboral</Label>
                      <Input {...regRRHH('acc_laboral_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">MUTUAL. Default: 0.34%</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Aporte SES</Label>
                      <Input {...regRRHH('aporte_ses_pct', { valueAsNumber: true })} type="number" step="0.0001" min="0" max="1" />
                      <p className="text-xs text-muted-foreground">Default: 0.03%</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Jornada laboral</h3>
                  <div className="max-w-xs space-y-1.5">
                    <Label>Horas semanales</Label>
                    <Input {...regRRHH('horas_semanales', { valueAsNumber: true })} type="number" step="1" min="1" max="60" />
                    <p className="text-xs text-muted-foreground">Ley 21.561. Default: 42 hrs</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Beneficios laborales (no imponibles)</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Movilización mensual ($)</Label>
                      <Input {...regRRHH('movilizacion_mensual', { valueAsNumber: true })} type="number" step="1" min="0" />
                      <p className="text-xs text-muted-foreground">Se prorratea por días trabajados. Se activa por trabajador en su ficha.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Colación mensual ($)</Label>
                      <Input {...regRRHH('colacion_mensual', { valueAsNumber: true })} type="number" step="1" min="0" />
                      <p className="text-xs text-muted-foreground">Se prorratea por días trabajados. Se activa por trabajador en su ficha.</p>
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

        </TabsContent>
      </Tabs>
    </div>
  );
}
