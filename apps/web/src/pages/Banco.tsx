import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Landmark, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Trash2, Loader2, ChevronLeft } from 'lucide-react';
import { cuentaBancariaSchema, movimientoBancoSchema, type CuentaBancariaInput, type MovimientoBancoInput } from '@contaweb/validations';
import type { CuentaBancaria } from '@contaweb/shared-types';
import { useCuentasBancarias, useCreateCuentaBancaria, useMovimientosBanco, useCreateMovimiento, useDeleteMovimiento, useConciliar } from '@/hooks/useBanco';
import { useEmpresaActual } from '@/hooks/useEmpresaActual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const TIPOS_MOV = ['COBRO_CLIENTE','PAGO_PROVEEDOR','PAGO_IVA','PAGO_PPM','PAGO_REMUNERACIONES','PAGO_HONORARIO','TRANSFERENCIA','COMISION_BANCO','INTERES_BANCO','INTERES_GANADO','RETIRO_DUENO','APORTE_CAPITAL','GASTO_GENERAL','OTRO'];
const TIPOS_MOV_LABELS: Record<string, string> = {
  COBRO_CLIENTE: 'Cobro cliente', PAGO_PROVEEDOR: 'Pago proveedor', PAGO_IVA: 'Pago IVA',
  PAGO_PPM: 'Pago PPM', PAGO_REMUNERACIONES: 'Pago remuneraciones', PAGO_HONORARIO: 'Pago honorario',
  TRANSFERENCIA: 'Transferencia', COMISION_BANCO: 'Comisión banco', INTERES_BANCO: 'Interés banco',
  INTERES_GANADO: 'Interés ganado', RETIRO_DUENO: 'Retiro dueño', APORTE_CAPITAL: 'Aporte capital',
  GASTO_GENERAL: 'Gasto general', OTRO: 'Otro',
};

function clp(n: string | number) {
  return Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
}

export default function Banco() {
  const hoy = new Date();
  const [cuentaActiva, setCuentaActiva] = useState<CuentaBancaria | null>(null);
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth() + 1);
  const [openCuenta, setOpenCuenta] = useState(false);
  const [openMov, setOpenMov] = useState(false);

  const { empresa, isLoading: loadingEmpresa } = useEmpresaActual();
  const { data: cuentasData, isLoading: loadingCuentas } = useCuentasBancarias(empresa?.id ?? '');
  const createCuenta = useCreateCuentaBancaria(empresa?.id ?? '');
  const { data: movsData, isLoading: loadingMovs } = useMovimientosBanco(empresa?.id ?? '', cuentaActiva?.id ?? '', anio, mes);
  const createMov = useCreateMovimiento(empresa?.id ?? '', cuentaActiva?.id ?? '');
  const deleteMov = useDeleteMovimiento(empresa?.id ?? '', cuentaActiva?.id ?? '');
  const conciliar = useConciliar(empresa?.id ?? '', cuentaActiva?.id ?? '');

  const cuentas = cuentasData?.data ?? [];
  const movimientos = movsData?.data ?? [];

  const totalCargos = movimientos.reduce((s, m) => s + Number(m.cargo), 0);
  const totalAbonos = movimientos.reduce((s, m) => s + Number(m.abono), 0);
  const ultimoMov = movimientos[movimientos.length - 1];
  const saldoActual = ultimoMov ? Number(ultimoMov.saldo) : Number(cuentaActiva?.saldoInicial ?? 0);

  const formCuenta = useForm<CuentaBancariaInput>({ resolver: zodResolver(cuentaBancariaSchema) });
  const formMov = useForm<MovimientoBancoInput>({
    resolver: zodResolver(movimientoBancoSchema),
    defaultValues: { fecha: hoy.toISOString().split('T')[0] as unknown as Date, cargo: 0, abono: 0, tipo: 'OTRO', cuentaId: '' },
  });

  function onSubmitCuenta(d: CuentaBancariaInput) {
    createCuenta.mutate(d, { onSuccess: () => { formCuenta.reset(); createCuenta.reset(); setOpenCuenta(false); } });
  }

  function onSubmitMov(d: MovimientoBancoInput) {
    createMov.mutate({ ...d, cuentaId: cuentaActiva!.id }, {
      onSuccess: () => { formMov.reset(); createMov.reset(); setOpenMov(false); },
    });
  }

  if (loadingEmpresa) return <div className="text-muted-foreground text-sm">Cargando empresa…</div>;
  if (!empresa) return <div className="flex flex-col items-center justify-center py-20 text-center"><p className="font-medium">No tienes empresas registradas</p></div>;

  // Vista: lista de cuentas
  if (!cuentaActiva) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Banco</h1>
            <p className="text-sm text-muted-foreground mt-1">{empresa.razonSocial}</p>
          </div>
          <Dialog open={openCuenta} onOpenChange={(v) => { if (!v) { formCuenta.reset(); createCuenta.reset(); } setOpenCuenta(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nueva cuenta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Nueva cuenta bancaria</DialogTitle></DialogHeader>
              <form id="form-cuenta" onSubmit={formCuenta.handleSubmit(onSubmitCuenta)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Banco *</Label>
                  <Input {...formCuenta.register('banco')} placeholder="Banco Estado" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Tipo de cuenta</Label>
                    <select {...formCuenta.register('tipoCuenta')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                      <option value="CORRIENTE">Corriente</option>
                      <option value="VISTA">Vista</option>
                      <option value="AHORRO">Ahorro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Número *</Label>
                    <Input {...formCuenta.register('numero')} placeholder="000-000000-00" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Saldo inicial</Label>
                  <Input {...formCuenta.register('saldoInicial', { valueAsNumber: true })} type="number" min="0" defaultValue={0} />
                </div>
                {createCuenta.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createCuenta.error.message}</p>}
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenCuenta(false)}>Cancelar</Button>
                <Button type="submit" form="form-cuenta" disabled={createCuenta.isPending}>
                  {createCuenta.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loadingCuentas ? (
          <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : cuentas.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <Landmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-sm">Sin cuentas bancarias</p>
            <p className="text-xs text-muted-foreground mt-1">Agrega tu primera cuenta con el botón de arriba</p>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cuentas.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setCuentaActiva(c)}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{c.banco}</p>
                      <p className="text-xs text-muted-foreground">{c.tipoCuenta} · {c.numero}</p>
                    </div>
                    <Badge variant="outline">{c.moneda}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Saldo inicial</p>
                  <p className="text-xl font-bold font-mono">{clp(c.saldoInicial)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Vista: movimientos de la cuenta
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setCuentaActiva(null)}><ChevronLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{cuentaActiva.banco}</h1>
            <p className="text-sm text-muted-foreground mt-1">{cuentaActiva.tipoCuenta} · {cuentaActiva.numero}</p>
          </div>
        </div>
        <Dialog open={openMov} onOpenChange={(v) => { if (!v) { formMov.reset(); createMov.reset(); } setOpenMov(v); }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Nuevo movimiento</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle><DialogDescription>Registrá un cargo o abono.</DialogDescription></DialogHeader>
            <form id="form-mov" onSubmit={formMov.handleSubmit(onSubmitMov)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Fecha *</Label><Input {...formMov.register('fecha')} type="date" /></div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <select {...formMov.register('tipo')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {TIPOS_MOV.map((t) => <option key={t} value={t}>{TIPOS_MOV_LABELS[t]}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5"><Label>Descripción *</Label><Input {...formMov.register('descripcion')} placeholder="Pago factura #123" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Cargo (egreso)</Label><Input {...formMov.register('cargo', { valueAsNumber: true })} type="number" min="0" defaultValue={0} /></div>
                <div className="space-y-1.5"><Label>Abono (ingreso)</Label><Input {...formMov.register('abono', { valueAsNumber: true })} type="number" min="0" defaultValue={0} /></div>
              </div>
              <div className="space-y-1.5"><Label>Glosa</Label><Input {...formMov.register('glosa')} placeholder="Opcional" /></div>
              {createMov.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{createMov.error.message}</p>}
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenMov(false)}>Cancelar</Button>
              <Button type="submit" form="form-mov" disabled={createMov.isPending}>{createMov.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
          {MESES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <Input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="w-24" min="2000" max="2100" />
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Cargos</p><p className="text-xl font-bold font-mono mt-1 text-destructive">{clp(totalCargos)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Abonos</p><p className="text-xl font-bold font-mono mt-1 text-green-600">{clp(totalAbonos)}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Saldo actual</p><p className="text-xl font-bold font-mono mt-1">{clp(saldoActual)}</p></CardContent></Card>
      </div>

      {/* Tabla movimientos */}
      {loadingMovs ? (
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : movimientos.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <p className="font-medium text-sm">Sin movimientos en este período</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Descripción</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Cargo</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground">Abono</th>
              <th className="text-right px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Saldo</th>
              <th className="w-20" />
            </tr></thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className={`border-b last:border-0 transition-colors ${m.conciliado ? 'bg-muted/20' : 'hover:bg-muted/30'}`}>
                  <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(m.fecha).toLocaleDateString('es-CL')}</td>
                  <td className="px-5 py-3">{m.descripcion}</td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell text-xs">{TIPOS_MOV_LABELS[m.tipo]}</td>
                  <td className="px-5 py-3 text-right font-mono text-destructive">{Number(m.cargo) > 0 ? clp(m.cargo) : '—'}</td>
                  <td className="px-5 py-3 text-right font-mono text-green-600">{Number(m.abono) > 0 ? clp(m.abono) : '—'}</td>
                  <td className="px-5 py-3 text-right font-mono font-medium hidden sm:table-cell">{clp(m.saldo)}</td>
                  <td className="px-5 py-3 flex items-center justify-end gap-1">
                    {!m.conciliado && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600" onClick={() => conciliar.mutate(m.id)} title="Conciliar">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {m.conciliado ? (
                      <span title="Conciliado"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /></span>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMov.mutate(m.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
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
