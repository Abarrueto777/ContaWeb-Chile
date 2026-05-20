import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Building2, Calculator, Zap, UserCheck, Upload, CheckCircle2 } from 'lucide-react';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { useUpsertValorUF } from '@/hooks/useUF';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

type UFForm = { uf: number; utm: number; imm: number };
type SIIResult = { imported: number; skipped: number } | null;

export default function Configuracion() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [savedEmpresa, setSavedEmpresa] = useState(false);
  const [savedUF, setSavedUF] = useState(false);
  const [fetchingUF, setFetchingUF] = useState(false);
  const [siiTipo, setSiiTipo] = useState<'compras' | 'ventas'>('compras');
  const [siiResult, setSiiResult] = useState<SIIResult>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { empresa, isLoading } = useEmpresaActual();
  const qc = useQueryClient();
  const upsertUF = useUpsertValorUF();

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

  const { register: regUF, handleSubmit: handleUF, setValue: setUFValue, formState: { isSubmitting: savingUF } } = useForm<UFForm>({
    defaultValues: { uf: 38500, utm: 68000, imm: 500000 },
  });

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

  async function fetchUFActual() {
    setFetchingUF(true);
    try {
      const res = await api.get<{ data: UFForm }>('/api/uf/fetch-actual');
      const { uf, utm, imm } = res.data.data;
      if (uf) setUFValue('uf', uf);
      if (utm) setUFValue('utm', utm);
      if (imm) setUFValue('imm', imm);
    } catch {
      // silencioso — el usuario verá los campos sin cambios
    } finally {
      setFetchingUF(false);
    }
  }

  async function importarSII() {
    if (!empresa || !fileRef.current?.files?.[0]) return;
    setImporting(true);
    setSiiResult(null);
    try {
      const file = fileRef.current.files[0];
      const csv = await file.text();
      const res = await api.post<{ data: SIIResult }>(`/api/empresas/${empresa.id}/sii/import`, { tipo: siiTipo, csv });
      setSiiResult(res.data.data);
      qc.invalidateQueries({ queryKey: ['compras'] });
      qc.invalidateQueries({ queryKey: ['documentos'] });
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setSiiResult(null);
    } finally {
      setImporting(false);
    }
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUF(onSaveUF)} className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
              <Button type="button" variant="outline" size="sm" onClick={fetchUFActual} disabled={fetchingUF}>
                {fetchingUF ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-2 h-3.5 w-3.5" />}
                Obtener automático
              </Button>
            </div>
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
            <p className="text-xs text-muted-foreground">Valores usados en cálculo de remuneraciones y topes imponibles.</p>
            <Button type="submit" disabled={savingUF || upsertUF.isPending}>
              {(savingUF || upsertUF.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedUF ? 'Guardado ✓' : 'Guardar valores'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Importación SII */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />Importar libro SII (CSV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="siiTipo" value="compras" checked={siiTipo === 'compras'} onChange={() => setSiiTipo('compras')} className="accent-primary" />
              Libro de Compras
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="siiTipo" value="ventas" checked={siiTipo === 'ventas'} onChange={() => setSiiTipo('ventas')} className="accent-primary" />
              Libro de Ventas
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Archivo CSV exportado desde mipyme.sii.cl</Label>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer" />
          </div>
          {siiResult && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Importados: <strong>{siiResult.imported}</strong> — Omitidos: <strong>{siiResult.skipped}</strong>
            </div>
          )}
          <Button onClick={importarSII} disabled={importing} variant="outline">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar
          </Button>
          <p className="text-xs text-muted-foreground">Los registros ya existentes (mismo proveedor y folio) se omiten sin error.</p>
        </CardContent>
      </Card>
    </div>
  );
}
