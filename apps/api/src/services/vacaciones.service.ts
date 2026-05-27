import type { PrismaClient } from '@prisma/client';

export function diasHabilesEntre(inicio: Date, fin: Date): number {
  let count = 0;
  const d = new Date(inicio);
  d.setHours(0, 0, 0, 0);
  const end = new Date(fin);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function diasProgresivos(aniosCompletados: number): number {
  return aniosCompletados >= 10 ? Math.floor((aniosCompletados - 10) / 3) : 0;
}

export function diasGanadosHastaHoy(fechaIngreso: Date): number {
  const hoy = new Date();
  const msPerYear = 365.25 * 24 * 3600 * 1000;
  const anos = (hoy.getTime() - fechaIngreso.getTime()) / msPerYear;
  const anosCompletos = Math.floor(anos);

  let total = 0;
  for (let y = 1; y <= anosCompletos; y++) {
    total += 15 + (y > 10 ? Math.floor((y - 10) / 3) : 0);
  }
  // Pro-rata del año en curso
  const diasEsteAno = 15 + (anosCompletos >= 10 ? Math.floor((anosCompletos - 10) / 3) : 0);
  total += Math.round(diasEsteAno * (anos - anosCompletos));

  return total;
}

export async function calcularSaldoTrabajador(
  empresaId: string,
  trabajadorId: string,
  prisma: PrismaClient,
): Promise<{ ganados: number; usados: number; saldo: number; progresivos: number; aniosServicio: number }> {
  const t = await prisma.trabajador.findUnique({ where: { id: trabajadorId } });
  if (!t) throw new Error('Trabajador no encontrado');

  const msPerYear = 365.25 * 24 * 3600 * 1000;
  const anios = (Date.now() - t.fechaIngreso.getTime()) / msPerYear;
  const anosCompletos = Math.floor(anios);

  const ganados = diasGanadosHastaHoy(t.fechaIngreso);
  const prog = diasProgresivos(anosCompletos);

  const vacaciones = await prisma.vacacion.findMany({
    where: { empresaId, trabajadorId, estado: 'APROBADA' },
  });
  const usados = vacaciones.reduce((s, v) => s + v.diasHabiles, 0);

  return { ganados, usados, saldo: ganados - usados, progresivos: prog, aniosServicio: Math.round(anios * 100) / 100 };
}
