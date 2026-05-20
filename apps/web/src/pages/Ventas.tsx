import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, FileText, Trash2, Loader2, PlusCircle } from 'lucide-react';
import { documentoSchema, type DocumentoInput } from '@contaweb/validations';
import { useDocumentos, useCreateDocumento } from '@/hooks/useDocumentos';
import { useClientes } from '@/hooks/useClientes';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const TIPO_LABELS: Record<string, string> = {
  FACTURA_ELECTRONICA: 'Factura',
  BOLETA_ELECTRONICA: 'Boleta',
  NOTA_CREDITO: 'Nota Crédito',
  NOTA_DEBITO: 'Nota Débito',
};

const ESTADO_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  BORRADOR: 'outline',
  EMITIDO: 'secondary',
  ACEPTADO_SII: 'default',
  RECHAZADO_SII: 'destructive',
  ANULADO: 'destructive',
};

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function Ventas() {
  const [open, setOpen] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useDocumentos(empresa?.id ?? '');
  const { data: clientesData } = useClientes(empresa?.id ?? '');
  const createMutation = useCreateDocumento(empresa?.id ?? '');

  const documentos = data?.data ?? [];
  const clientes = clientesData?.data ?? [];

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<DocumentoInput>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      tipo: 'FACTURA_ELECTRONICA',
      fecha: new Date().toISOString().split('T')[0] as unknown as Date,
      lineas: [{ descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineas' });
  const lineas = watch('lineas');

  const neto = lineas.reduce((sum, l) => {
    const sub = (l.cantidad ?? 0) * (l.precioUnitario ?? 0) * (1 - (l.descuento ?? 0) / 100);
    return sum + sub;
  }, 0);
  const iva = Math.round(neto * 0.19);
  const total = Math.round(neto) + iva;

  function onSubmit(d: DocumentoInput) {
    createMutation.mutate(d, {
      onSuccess: () => { reset(); createMutation.reset(); setOpen(false); },
    });
  }

  function handleOpenChange(v: boolean) {
    if (!v) { reset(); createMutation.reset(); setNuevoCliente(false); }
    setOpen(v);
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
          <h1 className="text-2xl font-bold tracking-tight">Libro de Ventas</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial} — {documentos.length} documento{documentos.length !== 1 ? 's' : ''}</p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nuevo documento</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo documento tributario</DialogTitle>
              <DialogDescription>El folio se asigna automáticamente.</DialogDescription>
            </DialogHeader>

            <form id="form-documento" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo *</Label>
                  <select {...register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="FACTURA_ELECTRONICA">Factura Electrónica</option>
                    <option value="BOLETA_ELECTRONICA">Boleta Electrónica</option>
                    <option value="NOTA_CREDITO">Nota de Crédito</option>
                    <option value="NOTA_DEBITO">Nota de Débito</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha *</Label>
                  <Input {...register('fecha')} type="date" />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label>Cliente</Label>
                    <button type="button" onClick={() => setNuevoCliente(!nuevoCliente)} className="text-xs text-primary hover:underline">
                      {nuevoCliente ? '← Seleccionar existente' : '+ Crear nuevo'}
                    </button>
                  </div>
                  {nuevoCliente ? (
                    <div className="flex gap-2">
                      <Input {...register('clienteRut')} placeholder="RUT (ej: 12.345.678-9)" className="w-36" />
                      <Input {...register('clienteNombre')} placeholder="Nombre o razón social" />
                    </div>
                  ) : (
                    <select {...register('clienteId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option value="">Sin cliente</option>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Glosa</Label>
                <Input {...register('glosa')} placeholder="Descripción del documento (opcional)" />
              </div>

              {/* Líneas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Líneas de detalle *</Label>
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={() => append({ descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0 })}
                  >
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    Agregar línea
                  </Button>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Descripción</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Cant.</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-28">Precio</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground w-20">Dto%</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground w-28">Subtotal</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, i) => {
                        const l = lineas[i];
                        const sub = (l?.cantidad ?? 0) * (l?.precioUnitario ?? 0) * (1 - (l?.descuento ?? 0) / 100);
                        return (
                          <tr key={field.id} className="border-b last:border-0">
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.descripcion`)} placeholder="Servicio o producto" className="h-8 text-sm" />
                            </td>
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.cantidad`, { valueAsNumber: true })} type="number" min="0" step="any" className="h-8 text-sm w-20" />
                            </td>
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.precioUnitario`, { valueAsNumber: true })} type="number" min="0" className="h-8 text-sm w-28" />
                            </td>
                            <td className="px-2 py-2">
                              <Input {...register(`lineas.${i}.descuento`, { valueAsNumber: true })} type="number" min="0" max="100" className="h-8 text-sm w-20" />
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-sm">{clp(sub)}</td>
                            <td className="px-2 py-2">
                              {fields.length > 1 && (
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {errors.lineas && <p className="text-xs text-destructive">{errors.lineas.message ?? errors.lineas.root?.message}</p>}
              </div>

              {/* Totales preview */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Neto</span><span className="font-mono">{clp(neto)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA 19%</span><span className="font-mono">{clp(iva)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1.5">
                  <span>Total</span><span className="font-mono">{clp(total)}</span>
                </div>
              </div>

              {createMutation.error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {createMutation.error.message}
                </p>
              )}
            </form>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={createMutation.isPending}>Cancelar</Button>
              <Button type="submit" form="form-documento" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir documento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : documentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin documentos emitidos</p>
            <p className="text-xs text-muted-foreground mt-1">Emitís tu primera factura o boleta con el botón de arriba</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Tipo / Folio</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Cliente</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Neto</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Total</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium">{TIPO_LABELS[d.tipo] ?? d.tipo}</p>
                    <p className="text-xs text-muted-foreground">Folio #{d.folio}</p>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden sm:table-cell">
                    {(d as any).cliente?.nombre ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground hidden md:table-cell">
                    {new Date(d.fecha).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono">{clp(d.neto)}</td>
                  <td className="px-5 py-4 text-right font-mono font-medium hidden sm:table-cell">{clp(d.total)}</td>
                  <td className="px-5 py-4">
                    <Badge variant={ESTADO_VARIANT[d.estado] ?? 'outline'} className="text-xs">
                      {d.estado}
                    </Badge>
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
