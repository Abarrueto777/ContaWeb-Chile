import { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen, Search, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cuentaContableSchema, cuentaContableUpdateSchema } from '@contaweb/validations';
import type { CuentaContableInput, CuentaContableUpdateInput } from '@contaweb/validations';
import { usePlanCuentas, useCreateCuenta, useUpdateCuenta, useDeleteCuenta } from '@/hooks/usePlanCuentas';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { CuentaContable, TipoCuenta } from '@contaweb/shared-types';

const TIPO_COLORS: Record<TipoCuenta, string> = {
  ACTIVO: 'text-blue-600',
  PASIVO: 'text-orange-600',
  PATRIMONIO: 'text-purple-600',
  INGRESO: 'text-green-600',
  GASTO: 'text-red-600',
};

const TIPO_BADGE: Record<TipoCuenta, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  ACTIVO: 'default',
  PASIVO: 'secondary',
  PATRIMONIO: 'outline',
  INGRESO: 'default',
  GASTO: 'destructive',
};

const SELECT_CLASS = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

// El interceptor reenvía el AxiosError crudo: extraemos el mensaje real del backend.
function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e.message;
}

export default function PlanCuentas() {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoCuenta | 'TODOS'>('TODOS');
  const [openCrear, setOpenCrear] = useState(false);
  const [editando, setEditando] = useState<CuentaContable | null>(null);
  const [borrando, setBorrando] = useState<CuentaContable | null>(null);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const empresaId = empresa?.id ?? '';
  const { data, isLoading } = usePlanCuentas(empresaId);
  const createCuenta = useCreateCuenta(empresaId);
  const updateCuenta = useUpdateCuenta(empresaId);
  const deleteCuenta = useDeleteCuenta(empresaId);

  const formCrear = useForm<CuentaContableInput>({
    resolver: zodResolver(cuentaContableSchema),
    defaultValues: { permiteMovimientos: true },
  });
  const formEditar = useForm<CuentaContableUpdateInput>({ resolver: zodResolver(cuentaContableUpdateSchema) });

  const todas = data?.data ?? [];
  const cuentas = todas.filter((c) => {
    const matchTipo = tipoFiltro === 'TODOS' || c.tipo === tipoFiltro;
    const matchBusqueda = busqueda === '' ||
      c.codigo.includes(busqueda) ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchBusqueda;
  });

  const onCrear = formCrear.handleSubmit((values) => {
    createCuenta.mutate(values, {
      onSuccess: () => { setOpenCrear(false); formCrear.reset({ permiteMovimientos: true }); },
    });
  });

  const abrirEditar = (c: CuentaContable) => {
    setEditando(c);
    formEditar.reset({ nombre: c.nombre, naturaleza: c.naturaleza, permiteMovimientos: c.permiteMovimientos });
  };

  const onEditar = formEditar.handleSubmit((values) => {
    if (!editando) return;
    updateCuenta.mutate({ cuentaId: editando.id, data: values }, {
      onSuccess: () => { setEditando(null); updateCuenta.reset(); },
    });
  });

  const onBorrar = () => {
    if (!borrando) return;
    deleteCuenta.mutate(borrando.id, {
      onSuccess: () => { setBorrando(null); deleteCuenta.reset(); },
    });
  };

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tienes empresas registradas</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan de Cuentas</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} — {cuentas.length} cuentas</p>
        </div>
        <Dialog open={openCrear} onOpenChange={(v) => { if (!v) { formCrear.reset({ permiteMovimientos: true }); createCuenta.reset(); } setOpenCrear(v); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Agregar cuenta</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar cuenta</DialogTitle>
              <DialogDescription>El código se calcula automáticamente a partir de la cuenta padre.</DialogDescription>
            </DialogHeader>
            <form id="form-crear-cuenta" onSubmit={onCrear} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Cuenta padre *</Label>
                <select {...formCrear.register('cuentaPadreId')} className={SELECT_CLASS} defaultValue="">
                  <option value="" disabled>Selecciona una cuenta…</option>
                  {todas.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                  ))}
                </select>
                {formCrear.formState.errors.cuentaPadreId && <p className="text-xs text-destructive">{formCrear.formState.errors.cuentaPadreId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input {...formCrear.register('nombre')} placeholder="Ej. Banco Santander" />
                {formCrear.formState.errors.nombre && <p className="text-xs text-destructive">{formCrear.formState.errors.nombre.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Naturaleza</Label>
                <select {...formCrear.register('naturaleza', { setValueAs: (v) => (v === '' ? undefined : v) })} className={SELECT_CLASS} defaultValue="">
                  <option value="">Heredar del padre</option>
                  <option value="DEUDORA">Deudora</option>
                  <option value="ACREEDORA">Acreedora</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...formCrear.register('permiteMovimientos')} className="h-4 w-4 rounded border-input" />
                Permite movimientos (cuenta imputable)
              </label>
              {createCuenta.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(createCuenta.error)}</p>}
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenCrear(false)}>Cancelar</Button>
              <Button type="submit" form="form-crear-cuenta" disabled={createCuenta.isPending}>
                {createCuenta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código o nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['TODOS', 'ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'GASTO'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${tipoFiltro === t ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-accent'}`}
            >
              {t === 'TODOS' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map((i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : cuentas.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">Sin cuentas encontradas</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground w-28">Código</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Nombre</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Tipo</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Naturaleza</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Movimientos</th>
              <th className="px-5 py-3 w-24"></th>
            </tr></thead>
            <tbody>
              {cuentas.map((c) => (
                <tr key={c.id} className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${c.nivel === 1 ? 'bg-muted/10' : ''}`}>
                  <td className="px-5 py-3">
                    <span className={`font-mono font-medium ${TIPO_COLORS[c.tipo]}`} style={{ paddingLeft: `${(c.nivel - 1) * 12}px` }}>
                      {c.codigo}
                    </span>
                  </td>
                  <td className="px-5 py-3" style={{ paddingLeft: `${20 + (c.nivel - 1) * 12}px` }}>
                    <span className={c.nivel === 1 ? 'font-semibold' : c.nivel === 2 ? 'font-medium' : 'text-muted-foreground'}>{c.nombre}</span>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell"><Badge variant={TIPO_BADGE[c.tipo]} className="text-xs">{c.tipo}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell text-xs">{c.naturaleza}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {c.permiteMovimientos
                      ? <span className="text-xs text-green-600">Sí</span>
                      : <span className="text-xs text-muted-foreground">No</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(c)} aria-label="Editar cuenta">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setBorrando(c)} aria-label="Borrar cuenta">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog editar */}
      <Dialog open={!!editando} onOpenChange={(v) => { if (!v) { setEditando(null); updateCuenta.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cuenta {editando?.codigo}</DialogTitle>
            <DialogDescription>El código y el tipo no se modifican para no afectar asientos existentes.</DialogDescription>
          </DialogHeader>
          <form id="form-editar-cuenta" onSubmit={onEditar} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input {...formEditar.register('nombre')} />
              {formEditar.formState.errors.nombre && <p className="text-xs text-destructive">{formEditar.formState.errors.nombre.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Naturaleza</Label>
              <select {...formEditar.register('naturaleza')} className={SELECT_CLASS}>
                <option value="DEUDORA">Deudora</option>
                <option value="ACREEDORA">Acreedora</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...formEditar.register('permiteMovimientos')} className="h-4 w-4 rounded border-input" />
              Permite movimientos (cuenta imputable)
            </label>
            {updateCuenta.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(updateCuenta.error)}</p>}
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>Cancelar</Button>
            <Button type="submit" form="form-editar-cuenta" disabled={updateCuenta.isPending}>
              {updateCuenta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar borrado */}
      <Dialog open={!!borrando} onOpenChange={(v) => { if (!v) { setBorrando(null); deleteCuenta.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar cuenta</DialogTitle>
            <DialogDescription>
              ¿Seguro que quieres borrar <span className="font-mono font-medium">{borrando?.codigo}</span> — {borrando?.nombre}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteCuenta.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(deleteCuenta.error)}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrando(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={onBorrar} disabled={deleteCuenta.isPending}>
              {deleteCuenta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Borrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
