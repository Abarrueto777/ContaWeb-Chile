import { Link } from 'react-router-dom';
import { Clock, Mail, CheckCircle2, LogOut } from 'lucide-react';
import { LogoMark } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMe, useLogout } from '@/hooks/useAuth';

// Etapa de cobro manual: el contador escribe, paga por transferencia y el admin
// activa su plan desde el panel. Cuando haya pasarela, esta página muta a checkout.
const CONTACTO_EMAIL = 'mitienda.aij@gmail.com';

export default function Suscripcion() {
  const { data } = useMe();
  const usuario = data?.data;
  const logout = useLogout();

  const ahora = Date.now();
  const suscripcionVigente = !!usuario?.suscripcionHasta && new Date(usuario.suscripcionHasta).getTime() > ahora;
  const trialVigente = !!usuario?.trialFin && new Date(usuario.trialFin).getTime() > ahora;
  const tieneAcceso = suscripcionVigente || trialVigente || usuario?.rol === 'ADMIN';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <LogoMark className="h-14 w-14 rounded-2xl shadow-md shadow-primary/30" />
          <h1 className="text-2xl font-bold tracking-tight">ContaCL<span className="text-primary">WEB</span></h1>
        </div>

        <Card><CardContent className="flex flex-col items-center text-center gap-4 py-10">
          {tieneAcceso ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-primary" />
              <p className="font-medium">Tu cuenta está activa</p>
              {suscripcionVigente && usuario?.suscripcionHasta && (
                <p className="text-sm text-muted-foreground">
                  Suscripción vigente hasta el {new Date(usuario.suscripcionHasta).toLocaleDateString('es-CL')}.
                </p>
              )}
              <Button asChild className="mt-2"><Link to="/dashboard">Ir a mi panel</Link></Button>
            </>
          ) : (
            <>
              <Clock className="h-12 w-12 text-orange-500" />
              <p className="font-medium">Tu período de prueba terminó</p>
              <p className="text-sm text-muted-foreground">
                Esperamos que estos 45 días te hayan servido para conocer ContaCLWEB.
                Tus datos están guardados tal como los dejaste: activá tu plan y seguí donde estabas.
              </p>
              <div className="w-full rounded-lg border bg-muted/40 px-4 py-3 text-left text-sm space-y-1">
                <p className="font-medium">¿Cómo activo mi plan?</p>
                <p className="text-muted-foreground">
                  Escribinos y te enviamos los datos para pagar por transferencia.
                  Apenas confirmemos el pago, activamos tu cuenta (plan mensual, semestral o anual).
                </p>
              </div>
              <Button asChild className="mt-1 w-full">
                <a href={`mailto:${CONTACTO_EMAIL}?subject=Quiero activar mi plan de ContaCLWEB`}>
                  <Mail className="mr-2 h-4 w-4" />Contactar para activar
                </a>
              </Button>
              <button onClick={logout} className="text-sm text-muted-foreground underline underline-offset-2 hover:no-underline inline-flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" />Cerrar sesión
              </button>
            </>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
