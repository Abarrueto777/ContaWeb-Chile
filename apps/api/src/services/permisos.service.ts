import type { PrismaClient } from '@prisma/client';

export function diasHabilesPermiso(inicio: Date, fin: Date, includeWeekends = false): number {
  let count = 0;
  const d = new Date(inicio);
  d.setHours(0, 0, 0, 0);
  const end = new Date(fin);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    const day = d.getDay();
    if (includeWeekends || (day !== 0 && day !== 6)) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export const DIAS_LEGALES: Partial<Record<string, number>> = {
  MATRIMONIO: 5,
  UNION_CIVIL: 5,
  FALLECIMIENTO: 3,
};

export const CON_GOCE_DEFAULT: Record<string, boolean> = {
  MATRIMONIO: true,
  UNION_CIVIL: true,
  FALLECIMIENTO: true,
  SIN_GOCE: false,
  ADMINISTRATIVO: true,
  OTRO: true,
};

export async function diasSinGoceEnMes(
  empresaId: string,
  trabajadorId: string,
  anio: number,
  mes: number,
  prisma: PrismaClient,
): Promise<number> {
  const inicioMes = new Date(anio, mes - 1, 1);
  const finMes = new Date(anio, mes, 0, 23, 59, 59);
  const [permisos, trabajador] = await Promise.all([
    prisma.permiso.findMany({
      where: { empresaId, trabajadorId, conGoce: false, fechaInicio: { lte: finMes }, fechaFin: { gte: inicioMes } },
    }),
    prisma.trabajador.findUnique({ where: { id: trabajadorId }, select: { trabajaFinSemana: true } }),
  ]);
  const includeWeekends = trabajador?.trabajaFinSemana ?? false;
  let total = 0;
  for (const p of permisos) {
    const pInicio = p.fechaInicio < inicioMes ? inicioMes : p.fechaInicio;
    const pFin = p.fechaFin > finMes ? finMes : p.fechaFin;
    total += diasHabilesPermiso(pInicio, pFin, includeWeekends);
  }
  return total;
}
