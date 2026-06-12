import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Package, TrendingDown, Loader2 } from 'lucide-react';
import { activoFijoSchema, type ActivoFijoInput } from '@contaweb/validations';
import { useActivos, useCreateActivo, useDepreciarActivo, useBajaActivo } from '@/hooks/useActivos';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const CATEGORIAS: Record<string, string> = {
  MAQUINARIA: 'Maquinaria', VEHICULO: 'Vehículo', MUEBLES: 'Muebles',
  EQUIPOS_COMPUTACION: 'Equipos Computación', CONSTRUCCION: 'Construcción',
  TERRENO: 'Terreno', OTRO: 'Otro',
};

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function Activos() {
  const [open, setOpen] = useState(false);
  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useActivos(empresa?.id ?? '');
  const createMutation = useCreateActivo(empresa?.id ?? '');
  const depreciarMutation = useDepreciarActivo(empresa?.id ?? '');
  const bajaMutation = useBajaActivo(empresa?.id ?? '');

  const activos = data?.data ?? [];
  const totalCosto = activos.reduce((s, a) => s + Number(a.costoCompra), 0);
  const totalAcum = activos.reduce((s, a) => s + Number(a.acumDepreciacion), 0);
  const totalNeto = totalCosto - totalAcum;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ActivoFijoInput>({
    resolver: zodResolver(activoFijoSchema),
    defaultValues: { categoria: 'OTRO', valorResidual: 0, fechaCompra: new Date().toISOString().split('T')[0] as unknown as Date },
  });

  function onSubmit(d: ActivoFijoInput) {
    createMutation.mutate(d, { onSuccess: () => { reset(); createMutation.reset(); setOpen(false); } });
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tienes empresas registradas</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activos Fijos</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); createMutation.reset(); } setOpen(v); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo activo</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nuevo activo fijo</DialogTitle><DialogDescription>La depreciación mensual se calcula automáticamente (método lineal).</DialogDescription></DialogHeader>
            <form id="form-activo" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5"><Label>Nombre *</Label><Input {...register('nombre')} placeholder="Camioneta Ford Ranger 2022" />{errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Categoría</Label>
                  <select {...register('categoria')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {Object.entries(CATEGORIAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><Label>Fecha de compra *</Label><Input {...register('fechaCompra')} type="date" /></div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5"><Label>Costo compra *</Label><Input {...register('costoCompra', { valueAsNumber: true })} type="number" min="0" />{errors.costoCompra && <p className="text-xs text-destructive">{errors.costoCompra.message}</p>}</div>
                <div className="space-y-1.5"><Label>Vida útil (años) *</Label><Input {...register('vidaUtilAnios', { valueAsNumber: true })} type="number" min="1" />{errors.vidaUtilAnios && <p className="text-xs text-destructive">{errors.vidaUtilAnios.message}</p>}</div>
                <div className="space-y-1.5"><Label>Valor residual</Label><Input {...register('valorResidual', { valueAsNumber: true })} type="number" min="0" /></div>
              </div>
              {createMutation.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createMutation.error.message}</p>}
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" form="form-activo" disabled={createMutation.isPending}>{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!isLoading && activos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Costo histórico</p><p className="text-xl font-bold font-mono mt-1">{clp(totalCosto)}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Deprec. acumulada</p><p className="text-xl font-bold font-mono mt-1 text-destructive">{clp(totalAcum)}</p></CardContent></Card>
          <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Valor neto libros</p><p className="text-xl font-bold font-mono mt-1">{clp(totalNeto)}</p></CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : activos.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <Package className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">Sin activos fijos registrados</p>
          <p className="text-xs text-muted-foreground mt-1">Registrá un activo con el botón de arriba</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Activo</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoría</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Costo</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Deprec/mes</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Acumulada</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Valor neto</th>
              <th className="w-24" />
            </tr></thead>
            <tbody>
              {activos.map((a) => {
                const neto = Number(a.costoCompra) - Number(a.acumDepreciacion);
                const pctUsado = Number(a.acumDepreciacion) / Number(a.costoCompra) * 100;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium">{a.nombre}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.fechaCompra).toLocaleDateString('es-CL')} · {a.vidaUtilAnios} años</p>
                      <div className="mt-1.5 h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full" style={{ width: `${Math.min(100, pctUsado)}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell"><Badge variant="outline">{CATEGORIAS[a.categoria]}</Badge></td>
                    <td className="px-5 py-4 text-right font-mono">{clp(a.costoCompra)}</td>
                    <td className="px-5 py-4 text-right font-mono text-muted-foreground hidden md:table-cell">{clp(a.depreciacionMes)}</td>
                    <td className="px-5 py-4 text-right font-mono text-destructive hidden md:table-cell">{clp(a.acumDepreciacion)}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold hidden sm:table-cell">{clp(neto)}</td>
                    <td className="px-5 py-4 flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => depreciarMutation.mutate(a.id)} disabled={depreciarMutation.isPending}>
                        <TrendingDown className="mr-1 h-3 w-3" />Depreciar
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => bajaMutation.mutate(a.id)} title="Dar de baja">✕</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
