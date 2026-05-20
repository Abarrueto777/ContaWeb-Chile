import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Users, Search, Pencil, Loader2 } from 'lucide-react';
import { clienteSchema, type ClienteInput } from '@contaweb/validations';
import type { Cliente } from '@contaweb/shared-types';
import { useClientes, useCreateCliente, useUpdateCliente } from '@/hooks/useClientes';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

function ClienteForm({
  defaultValues,
  onSubmit,
  isPending,
  error,
  onCancel,
  formId,
}: {
  defaultValues?: Partial<ClienteInput>;
  onSubmit: (d: ClienteInput) => void;
  isPending: boolean;
  error: Error | null;
  onCancel: () => void;
  formId: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    ...(defaultValues ? { defaultValues } : {}),
  });

  return (
    <>
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>RUT *</Label>
            <Input {...register('rut')} placeholder="12.345.678-9" />
            {errors.rut && <p className="text-xs text-destructive">{errors.rut.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input {...register('nombre')} placeholder="Juan Pérez" />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input {...register('email')} type="email" placeholder="cliente@ejemplo.cl" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Teléfono</Label>
            <Input {...register('telefono')} placeholder="+56 9 1234 5678" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Dirección</Label>
          <Input {...register('direccion')} placeholder="Av. Principal 123, Santiago" />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error.message}</p>
        )}
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancelar</Button>
        <Button type="submit" form={formId} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </>
  );
}

export default function Clientes() {
  const [busqueda, setBusqueda] = useState('');
  const [openCrear, setOpenCrear] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useClientes(empresa?.id ?? '');
  const createMutation = useCreateCliente(empresa?.id ?? '');
  const updateMutation = useUpdateCliente(empresa?.id ?? '', editando?.id ?? '');

  const clientes = (data?.data ?? []).filter(
    (c) =>
      busqueda === '' ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.rut.includes(busqueda)
  );

  function handleCreate(d: ClienteInput) {
    createMutation.mutate(d, { onSuccess: () => { createMutation.reset(); setOpenCrear(false); } });
  }

  function handleUpdate(d: ClienteInput) {
    updateMutation.mutate(d, { onSuccess: () => { updateMutation.reset(); setEditando(null); } });
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tenés empresas registradas</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>

        <Dialog open={openCrear} onOpenChange={(v) => { if (!v) createMutation.reset(); setOpenCrear(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo cliente</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nuevo cliente</DialogTitle>
              <DialogDescription>Ingresá los datos del cliente.</DialogDescription>
            </DialogHeader>
            <ClienteForm
              formId="form-crear-cliente"
              onSubmit={handleCreate}
              isPending={createMutation.isPending}
              error={createMutation.error}
              onCancel={() => { createMutation.reset(); setOpenCrear(false); }}
            />
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

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : clientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">{busqueda ? 'Sin resultados' : 'Aún no tenés clientes'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {busqueda ? 'Intentá con otro nombre o RUT' : 'Creá tu primer cliente con el botón de arriba'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">RUT</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{c.rut}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">{c.rut}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{c.email ?? '—'}</td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">{c.telefono ?? '—'}</td>
                  <td className="px-5 py-4">
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditando(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal editar */}
      <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { updateMutation.reset(); setEditando(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar cliente</DialogTitle>
            <DialogDescription>{editando?.nombre}</DialogDescription>
          </DialogHeader>
          {editando && (
            <ClienteForm
              formId="form-editar-cliente"
              defaultValues={{
                rut: editando.rut,
                nombre: editando.nombre,
                email: editando.email ?? '',
                telefono: editando.telefono ?? '',
                direccion: editando.direccion ?? '',
              }}
              onSubmit={handleUpdate}
              isPending={updateMutation.isPending}
              error={updateMutation.error}
              onCancel={() => { updateMutation.reset(); setEditando(null); }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
