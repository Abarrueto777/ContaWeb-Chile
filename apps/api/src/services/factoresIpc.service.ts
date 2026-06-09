import type { PrismaClient } from '@prisma/client';

/**
 * Factores de actualización IPC — tabla global (anio, mes) -> factor.
 * Se usan para corregir montos de períodos anteriores a diciembre del año
 * (DJ 1887 actualiza rentas; retiros aplican corrección monetaria).
 * Default 1.0 cuando no hay factor cargado para el mes.
 */

/** Mapa { mes: factor } de un año. Meses sin dato no aparecen (el consumidor usa 1.0). */
export async function getFactoresIpc(anio: number, prisma: PrismaClient): Promise<Record<number, number>> {
  const filas = await prisma.factorIpc.findMany({ where: { anio } });
  const map: Record<number, number> = {};
  for (const f of filas) map[f.mes] = Number(f.factor);
  return map;
}

/** Factor de un mes puntual; 1.0 si no está cargado. */
export async function getFactorIpc(anio: number, mes: number, prisma: PrismaClient): Promise<number> {
  const fila = await prisma.factorIpc.findUnique({ where: { anio_mes: { anio, mes } } });
  return fila ? Number(fila.factor) : 1.0;
}

/** Factor IPC del mes de una fecha; si no hay factor cargado usa el fallback dado. */
export async function factorIpcParaFecha(fecha: Date, fallback: number, prisma: PrismaClient): Promise<number> {
  const fila = await prisma.factorIpc.findUnique({
    where: { anio_mes: { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1 } },
  });
  return fila ? Number(fila.factor) : fallback;
}
