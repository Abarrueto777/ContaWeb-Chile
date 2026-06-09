import type { PrismaClient } from '@prisma/client';

/** Días calendario entre dos fechas, inclusivo. */
export function diasCalendarioEntre(inicio: Date, fin: Date): number {
  const a = new Date(inicio); a.setHours(0, 0, 0, 0);
  const b = new Date(fin); b.setHours(0, 0, 0, 0);
  if (b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

/**
 * Días de licencia médica que caen dentro del mes (intersección, días calendario).
 * El empleador descuenta estos días — los paga FONASA/ISAPRE vía subsidio. Tope 30.
 */
export async function diasLicenciaEnMes(
  empresaId: string,
  trabajadorId: string,
  anio: number,
  mes: number,
  prisma: PrismaClient,
): Promise<number> {
  const inicioMes = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 0);
  const licencias = await prisma.licenciaMedica.findMany({
    where: { empresaId, trabajadorId, fechaInicio: { lte: finMes }, fechaFin: { gte: inicioMes } },
  });
  let total = 0;
  for (const lm of licencias) {
    const ini = lm.fechaInicio < inicioMes ? inicioMes : lm.fechaInicio;
    const fin = lm.fechaFin > finMes ? finMes : lm.fechaFin;
    total += diasCalendarioEntre(ini, fin);
  }
  return Math.min(total, 30);
}

/**
 * Subsidio por incapacidad laboral que cae (al menos parcialmente) en el mes.
 * Se prorratea el monto registrado según los días de la licencia que caen en el período.
 * Renta no gravada — Art. 17 N°1 LIR.
 */
export async function subsidioLicenciaEnMes(
  empresaId: string,
  trabajadorId: string,
  anio: number,
  mes: number,
  prisma: PrismaClient,
): Promise<number> {
  const inicioMes = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 0);
  const licencias = await prisma.licenciaMedica.findMany({
    where: { empresaId, trabajadorId, fechaInicio: { lte: finMes }, fechaFin: { gte: inicioMes } },
  });
  let total = 0;
  for (const lm of licencias) {
    const subsidio = Number(lm.subsidioMonto);
    if (!subsidio) continue;
    const diasTotales = diasCalendarioEntre(lm.fechaInicio, lm.fechaFin);
    if (diasTotales <= 0) continue;
    const ini = lm.fechaInicio < inicioMes ? inicioMes : lm.fechaInicio;
    const fin = lm.fechaFin > finMes ? finMes : lm.fechaFin;
    const diasEnMes = diasCalendarioEntre(ini, fin);
    total += (subsidio / diasTotales) * diasEnMes;
  }
  return Math.round(total);
}
