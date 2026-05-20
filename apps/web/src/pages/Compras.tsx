import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, ShoppingCart, Loader2, Trash2, Upload, CheckCircle2 } from 'lucide-react';
import { facturaRecibidaSchema, type FacturaRecibidaInput } from '@contaweb/validations';
import { useCompras, useCreateCompra, useDeleteCompra } from '@/hooks/useCompras';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
type SIIResult = { imported: number; skipped: number } | null;

const TIPOS_IMP = [
  { value: 'NINGUNO', label: 'Sin imp. adicional' },
  { value: 'BEBIDAS_20', label: 'Bebidas 20%' },
  { value: 'BEBIDAS_31', label: 'Bebidas 31%' },
  { value: 'LUJO', label: 'Artículos de lujo 15%' },
  { value: 'CARNE', label: 'Carne (retención)' },
  { value: 'HARINA', label: 'Harina (retención)' },
  { value: 'DIESEL', label: 'Diesel (crédito)' },
];

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function Compras() {
  const now = new Date();
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [open, setOpen] = useState(false);
  const [siiResult, setSiiResult] = useState<SIIResult>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data, isLoading } = useCompras(empresa?.id ?? '', anio, mes);
  const createMutation = useCreateCompra(empresa?.id ?? '');
  const deleteMutation = useDeleteCompra(empresa?.id ?? '');
  const qc = useQueryClient();

  const compras = data?.data ?? [];

  const totales = compras.reduce(
    (acc, c) => ({
      neto: acc.neto + Number(c.neto),
      iva: acc.iva + Number(c.iva),
      total: acc.total + Number(c.total),
    }),
    { neto: 0, iva: 0, total: 0 }
  );

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FacturaRecibidaInput>({
    resolver: zodResolver(facturaRecibidaSchema),
    defaultValues: { tipo: 'FACTURA', tipoImpuesto: 'NINGUNO', impAdicional: 0, retencion: 0 },
  });

  const netoWatch = watch('neto');
  const tipoImpWatch = watch('tipoImpuesto');

  function calcularIVA(neto: number, tipoImp: string): { iva: number; impAdicional: number; retencion: number; total: number } {
    const iva = Math.round(neto * 0.19);
    let impAdicional = 0;
    let retencion = 0;
    if (tipoImp === 'BEBIDAS_20') impAdicional = Math.round(neto * 0.20);
    if (tipoImp === 'BEBIDAS_31') impAdicional = Math.round(neto * 0.31);
    if (tipoImp === 'LUJO') impAdicional = Math.round(neto * 0.15);
    if (tipoImp === 'CARNE' || tipoImp === 'HARINA') retencion = iva;
    const total = neto + iva + impAdicional;
    return { iva, impAdicional, retencion, total };
  }

  function onNetoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const neto = Number(e.target.value) || 0;
    const calc = calcularIVA(neto, tipoImpWatch ?? 'NINGUNO');
    setValue('iva', calc.iva);
    setValue('impAdicional', calc.impAdicional);
    setValue('retencion', calc.retencion);
    setValue('total', calc.total);
  }

  function onTipoImpChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const tipoImp = e.target.value as FacturaRecibidaInput['tipoImpuesto'];
    setValue('tipoImpuesto', tipoImp);
    const neto = Number(netoWatch) || 0;
    const calc = calcularIVA(neto, tipoImp);
    setValue('iva', calc.iva);
    setValue('impAdicional', calc.impAdicional);
    setValue('retencion', calc.retencion);
    setValue('total', calc.total);
  }

  function onSubmit(d: FacturaRecibidaInput) {
    createMutation.mutate(d, {
      onSuccess: () => { reset(); setOpen(false); },
    });
  }

  function handleOpenChange(v: boolean) {
    if (!v) { reset(); createMutation.reset(); }
    setOpen(v);
  }

  async function importarSII() {
    if (!empresa || !fileRef.current?.files?.[0]) return;
    setImporting(true);
    setSiiResult(null);
    try {
      const csv = await fileRef.current.files[0].text();
      const res = await api.post<{ data: SIIResult }>(`/api/empresas/${empresa.id}/sii/import`, { tipo: 'compras', csv });
      setSiiResult(res.data.data);
      qc.invalidateQueries({ queryKey: ['compras', empresa.id] });
      if (fileRef.current) fileRef.current.value = '';
    } catch {
      setSiiResult(null);
    } finally {
      setImporting(false);
    }
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-medium">No tenés empresas registradas</p>
      <p className="text-sm text-muted-foreground mt-1">Creá una empresa primero</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Libro de Compras</h1>
          <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nueva factura</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar factura recibida</DialogTitle>
              <DialogDescription>Los montos se calculan automáticamente al ingresar el neto.</DialogDescription>
            </DialogHeader>
            <form id="form-compra" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>RUT Proveedor *</Label>
                  <Input {...register('proveedorRut')} placeholder="76.123.456-7" />
                  {errors.proveedorRut && <p className="text-xs text-destructive">{errors.proveedorRut.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre Proveedor *</Label>
                  <Input {...register('proveedorNombre')} placeholder="Proveedor Ltda." />
                  {errors.proveedorNombre && <p className="text-xs text-destructive">{errors.proveedorNombre.message}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select {...register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="FACTURA">Factura</option>
                    <option value="NOTA_CREDITO">Nota de Crédito</option>
                    <option value="LIQUIDACION_FACTURA">Liq. Factura</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Folio *</Label>
                  <Input {...register('folio', { valueAsNumber: true })} type="number" placeholder="12345" />
                  {errors.folio && <p className="text-xs text-destructive">{errors.folio.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha *</Label>
                  <Input {...register('fecha')} type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tipo de impuesto adicional</Label>
                <select
                  {...register('tipoImpuesto')}
                  onChange={onTipoImpChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {TIPOS_IMP.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Neto ($) *</Label>
                  <Input
                    {...register('neto', { valueAsNumber: true })}
                    type="number"
                    placeholder="100000"
                    onChange={onNetoChange}
                  />
                  {errors.neto && <p className="text-xs text-destructive">{errors.neto.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>IVA ($)</Label>
                  <Input {...register('iva', { valueAsNumber: true })} type="number" readOnly className="bg-muted" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Imp. adicional ($)</Label>
                  <Input {...register('impAdicional', { valueAsNumber: true })} type="number" readOnly className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Retención ($)</Label>
                  <Input {...register('retencion', { valueAsNumber: true })} type="number" readOnly className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Total ($)</Label>
                  <Input {...register('total', { valueAsNumber: true })} type="number" readOnly className="bg-muted" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Glosa</Label>
                <Input {...register('glosa')} placeholder="Descripción opcional" />
              </div>

              {createMutation.error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {createMutation.error.message}
                </p>
              )}
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={createMutation.isPending}>Cancelar</Button>
              <Button type="submit" form="form-compra" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro período */}
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
        />
        <span className="text-sm text-muted-foreground">{compras.length} registros</span>
      </div>

      {/* Totales */}
      {compras.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Neto compras', value: totales.neto },
            { label: 'IVA Crédito Fiscal', value: totales.iva },
            { label: 'Total compras', value: totales.total },
          ].map((t) => (
            <Card key={t.label}>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground">{t.label}</p>
                <p className="text-lg font-bold mt-1">{clp(t.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabla */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : compras.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin compras registradas</p>
            <p className="text-xs text-muted-foreground mt-1">Registrá las facturas recibidas del período</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Proveedor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Folio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Neto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">IVA</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.proveedorNombre}</p>
                    <p className="text-xs text-muted-foreground">{c.proveedorRut}</p>
                    {c.tipoImpuesto !== 'NINGUNO' && (
                      <Badge variant="outline" className="text-xs mt-0.5">{c.tipoImpuesto}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">#{c.folio}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {new Date(c.fecha).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-right">{clp(c.neto)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{clp(c.iva)}</td>
                  <td className="px-4 py-3 text-right font-medium">{clp(c.total)}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(c.id)}
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

      {/* Importación SII */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />Importar libro de compras desde SII
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input ref={fileRef} type="file" accept=".csv,.txt" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm file:border-0 file:bg-transparent file:text-sm file:font-medium cursor-pointer" />
          {siiResult && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Importados: <strong>{siiResult.imported}</strong> — Omitidos (ya existían): <strong>{siiResult.skipped}</strong>
            </div>
          )}
          <Button onClick={importarSII} disabled={importing} variant="outline" size="sm">
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Importar CSV del SII
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
