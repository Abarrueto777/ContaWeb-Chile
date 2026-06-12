import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useMe } from '@/hooks/useAuth';

// Aviso de días restantes del trial. No se muestra a admins ni a suscriptores pagos.
// Informativo (slate) hasta los últimos 7 días, ahí pasa a urgente (naranja).
export default function TrialBanner() {
  const { data } = useMe();
  const usuario = data?.data;

  if (!usuario || usuario.rol === 'ADMIN') return null;

  const ahora = Date.now();
  if (usuario.suscripcionHasta && new Date(usuario.suscripcionHasta).getTime() > ahora) return null;
  if (!usuario.trialFin) return null;

  const diasRestantes = Math.ceil((new Date(usuario.trialFin).getTime() - ahora) / (24 * 60 * 60 * 1000));
  if (diasRestantes <= 0) return null; // vencido: el 402 del API ya redirige a /suscripcion

  const urgente = diasRestantes <= 7;

  return (
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
      urgente
        ? 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400'
        : 'border-border bg-muted/40 text-muted-foreground'
    }`}>
      <Clock className="h-4 w-4 shrink-0" />
      <p className="flex-1">
        {diasRestantes === 1
          ? 'Último día de tu período de prueba.'
          : `Te quedan ${diasRestantes} días de prueba.`}
      </p>
      <Link to="/suscripcion" className="font-medium underline underline-offset-2 hover:no-underline shrink-0">
        Ver planes
      </Link>
    </div>
  );
}
