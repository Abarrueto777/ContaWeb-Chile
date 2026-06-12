import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, CheckCircle2, LogOut, ArrowLeft, Landmark, Loader2, Send } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMe, useLogout, useSolicitarPlan } from '@/hooks/useAuth';
import { PLANES, DATOS_TRANSFERENCIA, fmtCLP, type PlanId } from '@/config/planes';

function msgError(e: Error | null): string | null {
  if (!e) return null;
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return e?.message ?? null;
}

export default function Suscripcion() {
  const { data } = useMe();
  const usuario = data?.data;
  const logout = useLogout();
  const solicitar = useSolicitarPlan();
  const [planElegido, setPlanElegido] = useState<PlanId | null>(null);

  const ahora = Date.now();
  const suscripcionVigente = !!usuario?.suscripcionHasta && new Date(usuario.suscripcionHasta).getTime() > ahora;
  const trialVigente = !!usuario?.trialFin && new Date(usuario.trialFin).getTime() > ahora;
  const diasTrial = usuario?.trialFin ? Math.ceil((new Date(usuario.trialFin).getTime() - ahora) / 86400000) : 0;

  const plan = PLANES.find((p) => p.id === planElegido) ?? null;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="w-full max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
        </div>

        {suscripcionVigente ? (
          <Card><CardContent className="flex flex-col items-center text-center gap-3 py-10">
            <CheckCircle2 className="h-12 w-12 text-primary" />
            <p className="font-medium">Tu suscripción está activa</p>
            <p className="text-sm text-muted-foreground">
              Vigente hasta el {new Date(usuario!.suscripcionHasta!).toLocaleDateString('es-CL')}.
            </p>
            <Button asChild className="mt-2"><Link to="/dashboard">Ir a mi panel</Link></Button>
          </CardContent></Card>
        ) : (
          <>
            {/* Encabezado según estado del trial */}
            <div className="text-center space-y-2">
              {trialVigente ? (
                <>
                  <h2 className="text-xl font-semibold">Elegí tu plan</h2>
                  <p className="text-sm text-muted-foreground">
                    Te quedan <span className="font-medium text-foreground">{diasTrial} {diasTrial === 1 ? 'día' : 'días'}</span> de
                    prueba. Activá tu plan ahora y seguí sin interrupciones.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex justify-center"><Clock className="h-10 w-10 text-orange-500" /></div>
                  <h2 className="text-xl font-semibold">Tu período de prueba terminó</h2>
                  <p className="text-sm text-muted-foreground">
                    Tus datos están guardados tal como los dejaste. Elegí un plan y seguí donde estabas.
                  </p>
                </>
              )}
            </div>

            {/* Planes */}
            <div className="grid sm:grid-cols-3 gap-4">
              {PLANES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPlanElegido(p.id); solicitar.reset(); }}
                  className={`relative rounded-xl border bg-card p-5 text-left transition-all hover:border-primary/60 ${
                    planElegido === p.id ? 'border-primary ring-2 ring-primary/30' : ''
                  }`}
                >
                  {p.destacado && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      Más conveniente
                    </span>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">{p.nombre}</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{fmtCLP(p.precio)}</p>
                  <p className="text-xs text-muted-foreground">{p.detalle}</p>
                  {p.ahorro && <p className="mt-2 text-xs font-medium text-primary">{p.ahorro}</p>}
                </button>
              ))}
            </div>

            {/* Datos de transferencia + aviso de pago */}
            {plan && (
              <Card><CardContent className="py-6 space-y-4">
                <div className="flex items-center gap-2 font-medium">
                  <Landmark className="h-4 w-4 text-primary" />
                  Transferí {fmtCLP(plan.precio)} (plan {plan.nombre.toLowerCase()}) a esta cuenta:
                </div>
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">Titular</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.titular}</dd></div>
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">RUT</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.rut}</dd></div>
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">Banco</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.banco}</dd></div>
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">Tipo de cuenta</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.tipoCuenta}</dd></div>
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">N° de cuenta</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.numero}</dd></div>
                  <div className="flex justify-between sm:block"><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{DATOS_TRANSFERENCIA.email}</dd></div>
                </dl>

                {solicitar.isSuccess ? (
                  <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <p>{solicitar.data?.message}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Cuando hagas la transferencia, avisanos con el botón: verificamos el pago y activamos tu plan.
                    </p>
                    <Button
                      className="w-full"
                      disabled={solicitar.isPending}
                      onClick={() => solicitar.mutate({ plan: plan.id })}
                    >
                      {solicitar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Ya transferí — solicitar activación
                    </Button>
                    {solicitar.error && (
                      <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{msgError(solicitar.error)}</p>
                    )}
                  </>
                )}
              </CardContent></Card>
            )}

            {/* Salidas */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              {trialVigente && (
                <Link to="/dashboard" className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:no-underline">
                  <ArrowLeft className="h-3.5 w-3.5" />Volver a mi panel
                </Link>
              )}
              <button onClick={logout} className="inline-flex items-center gap-1.5 underline underline-offset-2 hover:no-underline">
                <LogOut className="h-3.5 w-3.5" />Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
