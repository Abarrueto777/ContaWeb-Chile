import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Building2, Search, Loader2 } from 'lucide-react';
import { empresaSchema, type EmpresaInput } from '@contaweb/validations';
import { useEmpresas, useCreateEmpresa } from '@/hooks/useEmpresas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function Empresas() {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { data, isLoading } = useEmpresas();
  const { mutate, isPending, error, reset: resetMutation } = useCreateEmpresa();

  const empresas = (data?.data ?? []).filter(
    (e) =>
      busqueda === '' ||
      e.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.rut.includes(busqueda)
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmpresaInput>({ resolver: zodResolver(empresaSchema) });

  function onSubmit(d: EmpresaInput) {
    mutate(d, {
      onSuccess: () => {
        reset();
        resetMutation();
        setOpen(false);
      },
    });
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      reset();
      resetMutation();
    }
    setOpen(v);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.data?.length ?? 0} empresa{(data?.data?.length ?? 0) !== 1 ? 's' : ''} registrada{(data?.data?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva empresa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva empresa</DialogTitle>
              <DialogDescription>
                Completa los datos de la empresa. RUT con puntos y guión (ej: 76.123.456-7).
              </DialogDescription>
            </DialogHeader>

            <form id="form-empresa" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rut">RUT *</Label>
                  <Input id="rut" {...register('rut')} placeholder="76.123.456-7" />
                  {errors.rut && <p className="text-xs text-destructive">{errors.rut.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="razonSocial">Razón Social *</Label>
                  <Input id="razonSocial" {...register('razonSocial')} placeholder="Empresa Ejemplo Ltda." />
                  {errors.razonSocial && <p className="text-xs text-destructive">{errors.razonSocial.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="giro">Giro *</Label>
                <Input id="giro" {...register('giro')} placeholder="Servicios de contabilidad" />
                {errors.giro && <p className="text-xs text-destructive">{errors.giro.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="actividadEconomica">Actividad económica</Label>
                <Input id="actividadEconomica" {...register('actividadEconomica')} placeholder="Código SII (opcional)" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" {...register('email')} type="email" placeholder="empresa@ejemplo.cl" />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" {...register('telefono')} placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" {...register('direccion')} placeholder="Av. Providencia 123, Santiago" />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error.message}
                </p>
              )}
            </form>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" form="form-empresa" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Creando…' : 'Crear empresa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o RUT…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse w-48" />
                    <div className="h-3 bg-muted rounded animate-pulse w-32" />
                  </div>
                  <div className="h-6 bg-muted rounded animate-pulse w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : empresas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">
              {busqueda ? 'Sin resultados' : 'Aún no tienes empresas'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {busqueda
                ? 'Intenta con otro nombre o RUT'
                : 'Crea tu primera empresa con el botón de arriba'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Razón Social</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">RUT</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Giro</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{e.razonSocial}</p>
                    <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{e.rut}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{e.rut}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell truncate max-w-[200px]">
                    {e.giro}
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">Activa</Badge>
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
