interface FechasSuscripcion {
  trialFin: Date | null;
  suscripcionHasta: Date | null;
}

export interface EstadoSuscripcion {
  trialVigente: boolean;
  suscripcionVigente: boolean;
  diasRestantesTrial: number | null;
}

// Única fuente de verdad para "¿puede usar el sistema?" — la usan requireSuscripcion
// (backend) y /api/auth/me (consumido por TrialBanner y Suscripcion en el frontend).
export function getEstadoSuscripcion(usuario: FechasSuscripcion, ahora = new Date()): EstadoSuscripcion {
  const ahoraMs = ahora.getTime();
  const trialVigente = !!usuario.trialFin && usuario.trialFin.getTime() > ahoraMs;
  const suscripcionVigente = !!usuario.suscripcionHasta && usuario.suscripcionHasta.getTime() > ahoraMs;
  const diasRestantesTrial = usuario.trialFin
    ? Math.ceil((usuario.trialFin.getTime() - ahoraMs) / (24 * 60 * 60 * 1000))
    : null;

  return { trialVigente, suscripcionVigente, diasRestantesTrial };
}

export function conEstadoSuscripcion<T extends FechasSuscripcion>(usuario: T, ahora = new Date()): T & EstadoSuscripcion {
  return { ...usuario, ...getEstadoSuscripcion(usuario, ahora) };
}

// Activar/extender suscripción manual: arranca donde termina lo que ya tiene vigente
// (suscripción previa o días de trial restantes) — pagar antes no regala ni quita días.
export function calcularExtensionSuscripcion(actual: FechasSuscripcion, meses: 1 | 6 | 12, ahora = new Date()): Date {
  let base = ahora;
  if (actual.suscripcionHasta && actual.suscripcionHasta > base) base = actual.suscripcionHasta;
  if (actual.trialFin && actual.trialFin > base) base = actual.trialFin;

  const hasta = new Date(base);
  hasta.setMonth(hasta.getMonth() + meses);
  return hasta;
}
