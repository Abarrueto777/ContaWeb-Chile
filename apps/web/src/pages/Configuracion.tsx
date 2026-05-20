import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Loader2, Building2, Calculator } from 'lucide-react';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useUpsertValorUF } from '@/hooks/useUF';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Configuracion() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [savedEmpresa, setSavedEmpresa] = useState(false);
  const [savedUF, setSavedUF] = useState(false);

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
    } as EmpresaInput,
  } : {};

  const { register: regEmpresa, handleSubmit: handleEmpresa, formState: { errors: errEmpresa, isSubmitting: savingEmpresa } } = useForm<EmpresaInput>({
    resolver: zodResolver(empresaSchema),
    ...empresaFormOpts,
  });

  const { register: regUF, handleSubmit: handleUF, formState: { isSubmitting: savingUF } } = useForm<{ uf: number; utm: number; imm: number }>({
    defaultValues: { uf: 38500, utm: 68000, imm: 500000 },
  });

  async function onSaveEmpresa(data: EmpresaInput) {
    if (!empresa) return;
    await api.put(`/api/empresas/${empresa.id}`, data);
    qc.invalidateQueries({ queryKey: ['empresas'] });
    setSavedEmpresa(true);
    setTimeout(() => setSavedEmpresa(false), 2000);
  }

  function onSaveUF(data: { uf: number; utm: number; imm: number }) {
    upsertUF.mutate({ anio, mes, ...data }, {
      onSuccess: () => { setSavedUF(true); setTimeout(() => setSavedUF(false), 2000); },
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

      {/* Valores UF/UTM/IMM */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4" />Valores UF / UTM / IMM
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUF(onSaveUF)} className="space-y-4">
            <div className="flex items-center gap-3">
              <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
              <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
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
            <p className="text-xs text-muted-foreground">Estos valores se usan en el cálculo de remuneraciones y topes imponibles.</p>
            <Button type="submit" disabled={savingUF || upsertUF.isPending}>
              {(savingUF || upsertUF.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savedUF ? 'Guardado ✓' : 'Guardar valores'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
