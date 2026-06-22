import { useState } from 'react';
import axios from 'axios';
import { Users, Trash2, Ban, CheckCircle2, Loader2, ShieldCheck, CreditCard } from 'lucide-react';
import { useAdminUsuarios, useUpdateEstadoUsuario, useDeleteUsuario, useActivarSuscripcion, useQuitarSuscripcion, type AdminUsuario } from '@/hooks/useAdminUsuarios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e.message;
}

const fmtFecha = (iso: string) => new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Estado comercial del usuario: suscripción paga > trial vigente > vencido.
// trialVigente/suscripcionVigente/diasRestantesTrial vienen calculados del backend
// (suscripcion.service.ts) — no se recalculan a mano para no desincronizar la regla.
function suscripcionLabel(u: AdminUsuario): { texto: string; clase: string } {
  if (u.suscripcionVigente && u.suscripcionHasta) {
    return { texto: `Paga hasta ${fmtFecha(u.suscripcionHasta)}`, clase: 'text-green-600' };
  }
  if (u.trialVigente) {
    return { texto: `Trial (${u.diasRestantesTrial}d)`, clase: 'text-blue-600' };
  }
  return { texto: 'Vencida', clase: 'text-orange-600' };
}

export default function AdminUsuarios() {
  const { data, isLoading } = useAdminUsuarios();
  const updateEstado = useUpdateEstadoUsuario();
  const deleteUsuario = useDeleteUsuario();
  const activar = useActivarSuscripcion();
  const quitar = useQuitarSuscripcion();
  const [borrando, setBorrando] = useState<AdminUsuario | null>(null);
  const [activando, setActivando] = useState<AdminUsuario | null>(null);
  const [mesesElegido, setMesesElegido] = useState<1 | 6 | 12 | null>(null);
  const [quitando, setQuitando] = useState(false);
  const [esCorreccion, setEsCorreccion] = useState(false);

  const cerrarActivacion = () => {
    setActivando(null); setMesesElegido(null); setQuitando(false); setEsCorreccion(false);
    activar.reset(); quitar.reset();
  };

  // Misma regla que el backend, solo para MOSTRAR la fecha proyectada en la confirmación:
  // base = lo vigente más lejano (hoy / suscripción / trial) + meses del plan.
  const fechaProyectada = (u: AdminUsuario, meses: number): string => {
    let base = Date.now();
    if (u.suscripcionHasta && new Date(u.suscripcionHasta).getTime() > base) base = new Date(u.suscripcionHasta).getTime();
    if (u.trialFin && new Date(u.trialFin).getTime() > base) base = new Date(u.trialFin).getTime();
    const d = new Date(base);
    d.setMonth(d.getMonth() + meses);
    return fmtFecha(d.toISOString());
  };

  const nombrePlan = (meses: 1 | 6 | 12) => (meses === 1 ? 'Mensual' : meses === 6 ? 'Semestral' : 'Anual');

  const onConfirmarActivar = () => {
    if (!activando || !mesesElegido) return;
    activar.mutate({ id: activando.id, meses: mesesElegido, correccion: esCorreccion }, { onSuccess: cerrarActivacion });
  };

  const onQuitar = () => {
    if (!activando) return;
    quitar.mutate(activando.id, { onSuccess: cerrarActivacion });
  };

  const usuarios = data?.data ?? [];

  // Resumen de conversión — solo clientes (el ADMIN no tiene trial/suscripción).
  // "Resueltos" = el trial ya terminó (pagó o no); conversión se mide sobre esos,
  // los que siguen en trial todavía no tienen un desenlace.
  const clientes = usuarios.filter((u) => u.rol !== 'ADMIN');
  const pagando = clientes.filter((u) => u.suscripcionVigente).length;
  const enTrial = clientes.filter((u) => u.trialVigente && !u.suscripcionVigente).length;
  const vencidosSinPagar = clientes.filter((u) => !u.trialVigente && !u.suscripcionVigente).length;
  const resueltos = pagando + vencidosSinPagar;
  const tasaConversion = resueltos > 0 ? Math.round((pagando / resueltos) * 100) : null;

  const toggleEstado = (u: AdminUsuario) => {
    updateEstado.mutate({ id: u.id, estado: u.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO' });
  };

  const onBorrar = () => {
    if (!borrando) return;
    deleteUsuario.mutate(borrando.id, {
      onSuccess: () => { setBorrando(null); deleteUsuario.reset(); },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-sm text-muted-foreground mt-1">{usuarios.length} usuarios registrados</p>
      </div>

      {!isLoading && clientes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">En trial</p>
            <p className="text-2xl font-bold text-blue-600">{enTrial}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Pagando</p>
            <p className="text-2xl font-bold text-green-600">{pagando}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Vencidos sin pagar</p>
            <p className="text-2xl font-bold text-orange-600">{vencidosSinPagar}</p>
          </CardContent></Card>
          <Card><CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Conversión {resueltos > 0 && <span className="opacity-70">({resueltos} resueltos)</span>}</p>
            <p className="text-2xl font-bold">{tasaConversion !== null ? `${tasaConversion}%` : '—'}</p>
          </CardContent></Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : usuarios.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-14 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-sm">Sin usuarios</p>
        </CardContent></Card>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Usuario</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">Rol</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Empresas</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Alta</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">Suscripción</th>
              <th className="px-5 py-3 w-36"></th>
            </tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">{u.nombre}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {u.rol === 'ADMIN'
                      ? <Badge variant="default" className="text-xs gap-1"><ShieldCheck className="h-3 w-3" />ADMIN</Badge>
                      : <Badge variant="secondary" className="text-xs">{u.rol}</Badge>}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">{u._count.empresas}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">{fmtFecha(u.createdAt)}</td>
                  <td className="px-5 py-3">
                    {u.estado === 'ACTIVO'
                      ? <span className="text-xs text-green-600 font-medium">Activo</span>
                      : <span className="text-xs text-orange-600 font-medium">Suspendido</span>}
                  </td>
                  <td className="px-5 py-3">
                    {u.rol === 'ADMIN'
                      ? <span className="text-xs text-muted-foreground">—</span>
                      : <span className={`text-xs font-medium ${suscripcionLabel(u).clase}`}>{suscripcionLabel(u).texto}</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {u.rol === 'ADMIN' ? (
                      <span className="text-xs text-muted-foreground italic pr-2">protegido</span>
                    ) : (
                      <>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title="Activar / extender suscripción"
                          onClick={() => setActivando(u)}
                        >
                          <CreditCard className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          title={u.estado === 'ACTIVO' ? 'Suspender' : 'Reactivar'}
                          disabled={updateEstado.isPending}
                          onClick={() => toggleEstado(u)}
                        >
                          {u.estado === 'ACTIVO'
                            ? <Ban className="h-4 w-4 text-orange-600" />
                            : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Borrar" onClick={() => setBorrando(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {updateEstado.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(updateEstado.error)}</p>
      )}

      {/* Activar / extender / quitar suscripción (dos pasos: elegir → confirmar) */}
      <Dialog open={!!activando} onOpenChange={(v) => { if (!v) cerrarActivacion(); }}>
        <DialogContent className="sm:max-w-md">
          {quitando && activando ? (
            <>
              <DialogHeader>
                <DialogTitle>Quitar suscripción</DialogTitle>
                <DialogDescription>
                  Vas a quitar la suscripción paga de <span className="font-medium">{activando.nombre}</span> ({activando.email}),
                  hoy vigente hasta el {activando.suscripcionHasta ? fmtFecha(activando.suscripcionHasta) : '—'}.
                  Vuelve al estado de su prueba (vigente o vencida). <span className="font-medium">No se envía ningún correo al cliente.</span>
                </DialogDescription>
              </DialogHeader>
              {quitar.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(quitar.error)}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setQuitando(false)} disabled={quitar.isPending}>Volver</Button>
                <Button variant="destructive" onClick={onQuitar} disabled={quitar.isPending}>
                  {quitar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Quitar suscripción
                </Button>
              </DialogFooter>
            </>
          ) : mesesElegido && activando ? (
            <>
              <DialogHeader>
                <DialogTitle>Confirmar activación</DialogTitle>
                <DialogDescription>
                  ¿Activar el plan <span className="font-medium">{nombrePlan(mesesElegido)}</span> (+{mesesElegido} {mesesElegido === 1 ? 'mes' : 'meses'}) para{' '}
                  <span className="font-medium">{activando.nombre}</span> ({activando.email})?
                  La suscripción quedará vigente hasta el <span className="font-medium">{fechaProyectada(activando, mesesElegido)}</span>.
                  Al confirmar se le envía el correo de plan activado.
                </DialogDescription>
              </DialogHeader>
              <label className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={esCorreccion}
                  onChange={(e) => setEsCorreccion(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="font-medium">Es una corrección de un error anterior.</span>{' '}
                  <span className="text-muted-foreground">El correo le pedirá disculpas al cliente y aclarará cuál es su plan correcto.</span>
                </span>
              </label>
              {activar.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(activar.error)}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setMesesElegido(null)} disabled={activar.isPending}>Volver</Button>
                <Button onClick={onConfirmarActivar} disabled={activar.isPending}>
                  {activar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar y enviar correo
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Activar suscripción</DialogTitle>
                <DialogDescription>
                  Activar o extender el plan de <span className="font-medium">{activando?.nombre}</span> ({activando?.email}).
                  {activando?.suscripcionHasta && new Date(activando.suscripcionHasta).getTime() > Date.now()
                    ? ` Hoy está paga hasta el ${fmtFecha(activando.suscripcionHasta)}: el período nuevo se suma a esa fecha.`
                    : activando?.trialFin && new Date(activando.trialFin).getTime() > Date.now()
                      ? ` Está en prueba hasta el ${fmtFecha(activando.trialFin)}: el plan arranca cuando termine (no pierde días de trial).`
                      : ' El período arranca hoy.'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-center gap-2">
                <Button variant="outline" onClick={() => setMesesElegido(1)}>+1 mes</Button>
                <Button variant="outline" onClick={() => setMesesElegido(6)}>+6 meses</Button>
                <Button onClick={() => setMesesElegido(12)}>+12 meses</Button>
              </DialogFooter>
              {activando?.suscripcionHasta && new Date(activando.suscripcionHasta).getTime() > Date.now() && (
                <button
                  onClick={() => setQuitando(true)}
                  className="text-xs text-destructive underline underline-offset-2 hover:no-underline self-center"
                >
                  Quitar la suscripción actual (corregir un error)
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmar borrado */}
      <Dialog open={!!borrando} onOpenChange={(v) => { if (!v) { setBorrando(null); deleteUsuario.reset(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Borrar usuario</DialogTitle>
            <DialogDescription>
              Vas a borrar a <span className="font-medium">{borrando?.nombre}</span> ({borrando?.email}) y
              <span className="font-medium"> TODOS sus datos</span>
              {borrando && borrando._count.empresas > 0 ? `, incluidas sus ${borrando._count.empresas} empresa(s) con toda su contabilidad` : ''}.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {deleteUsuario.error && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(deleteUsuario.error)}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBorrando(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={onBorrar} disabled={deleteUsuario.isPending}>
              {deleteUsuario.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Borrar todo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
