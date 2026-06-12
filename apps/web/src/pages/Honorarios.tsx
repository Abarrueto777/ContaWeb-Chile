import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Receipt, Trash2, Loader2 } from 'lucide-react';
import { honorarioSchema, type HonorarioInput } from '@contaweb/validations';
import { useHonorarios, useCreateHonorario, useDeleteHonorario } from '@/hooks/useHonorarios';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function Honorarios() {
  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [open, setOpen] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useHonorarios(empresa?.id ?? '', anio, mes);
  const createMutation = useCreateHonorario(empresa?.id ?? '');
  const deleteMutation = useDeleteHonorario(empresa?.id ?? '');

  const honorarios = data?.data ?? [];

  const totalMonto = honorarios.reduce((s, h) => s + Number(h.monto), 0);
  const totalRetencion = honorarios.reduce((s, h) => s + Number(h.retencion), 0);
  const totalLiquido = totalMonto - totalRetencion;

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<HonorarioInput>({
    resolver: zodResolver(honorarioSchema),
    defaultValues: {
      fecha: hoy.toISOString().split('T')[0] as unknown as Date,
      retiene: true,
    },
  });

  const retiene = watch('retiene');

  function onSubmit(d: HonorarioInput) {
    createMutation.mutate(d, {
      onSuccess: () => { reset(); createMutation.reset(); setOpen(false); },
    });
  }

  function handleOpenChange(v: boolean) {
    if (!v) { reset(); createMutation.reset(); }
    setOpen(v);
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tienes empresas registradas</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Honorarios</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo honorario</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo honorario</DialogTitle>
              <DialogDescription>La retención se calcula automáticamente (15,25% si retiene).</DialogDescription>
            </DialogHeader>

            <form id="form-honorario" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>RUT Prestador *</Label>
                  <Input {...register('prestadorRut')} placeholder="12.345.678-9" />
                  {errors.prestadorRut && <p className="text-xs text-destructive">{errors.prestadorRut.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre Prestador *</Label>
                  <Input {...register('prestadorNombre')} placeholder="Juan Pérez" />
                  {errors.prestadorNombre && <p className="text-xs text-destructive">{errors.prestadorNombre.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Folio *</Label>
                  <Input {...register('folio', { valueAsNumber: true })} type="number" min="1" />
                  {errors.folio && <p className="text-xs text-destructive">{errors.folio.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha *</Label>
                  <Input {...register('fecha')} type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label>Monto bruto *</Label>
                  <Input {...register('monto', { valueAsNumber: true })} type="number" min="0" placeholder="0" />
                  {errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Glosa</Label>
                <Input {...register('glosa')} placeholder="Descripción del servicio (opcional)" />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!retiene}
                  onChange={(e) => setValue('retiene', e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Empresa retiene (15,25%)</span>
              </label>

              {createMutation.error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {createMutation.error.message}
                </p>
              )}
            </form>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={createMutation.isPending}>Cancelar</Button>
              <Button type="submit" form="form-honorario" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro mes/año */}
      <div className="flex items-center gap-3">
        <select
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <Input
          type="number"
          value={anio}
          onChange={(e) => setAnio(Number(e.target.value))}
          className="w-24"
          min="2000"
          max="2100"
        />
      </div>

      {/* Resumen */}
      {!isLoading && honorarios.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Total bruto</p>
              <p className="text-xl font-bold font-mono mt-1">{clp(totalMonto)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Retención (15,25%)</p>
              <p className="text-xl font-bold font-mono mt-1 text-destructive">{clp(totalRetencion)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Líquido a pagar</p>
              <p className="text-xl font-bold font-mono mt-1">{clp(totalLiquido)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : honorarios.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin honorarios en este período</p>
            <p className="text-xs text-muted-foreground mt-1">Registrá un honorario con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Prestador</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Folio</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Bruto</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Retención</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Líquido</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {honorarios.map((h) => (
                <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{h.prestadorNombre}</p>
                    <p className="text-xs text-muted-foreground">{h.prestadorRut}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">#{h.folio}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    {new Date(h.fecha).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono">{clp(h.monto)}</td>
                  <td className="px-5 py-4 text-right font-mono text-destructive hidden sm:table-cell">
                    {h.retiene ? clp(h.retencion) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium hidden sm:table-cell">
                    {clp(Number(h.monto) - (h.retiene ? Number(h.retencion) : 0))}
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(h.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
