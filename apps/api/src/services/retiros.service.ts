import type { PrismaClient } from '@prisma/client';
import { getConfig } from './config.service';

/**
 * Retiros de socios/dueños + DJ 1886 (Retiros, Remesas y/o Distribuciones).
 *
 * - montoCorregido = monto × factorIpc (corrección monetaria; factor 1.0 por defecto).
 * - creditoIdpc almacenado = monto × tasa 1ª Cat. para rentas AFECTAS (se usa en DJ 1948).
 * - DJ 1886: por socio, suma montoCorregido por tipo de renta; el incremento por IDPC se
 *   calcula con gross-up: incremento = afecta × tasa/(1−tasa), y el crédito = incremento.
 */

export interface RetiroCalculo {
  montoCorregido: number;
  creditoIdpc: number;
}

/** Calcula montoCorregido y creditoIdpc al registrar/editar un retiro. */
export function calcularRetiro(
  monto: number,
  factorIpc: number,
  tipoRenta: 'AFECTA' | 'EXENTA' | 'NO_RENTA',
  tasa1cat: number,
): RetiroCalculo {
  return {
    montoCorregido: Math.round(monto * factorIpc),
    creditoIdpc: tipoRenta === 'AFECTA' ? Math.round(monto * tasa1cat) : 0,
  };
}

export interface DJ1886Socio {
  nro: number;
  rut: string;
  nombre: string;
  tipo: string;
  porcentaje: string;
  nRetiros: number;
  afecta: number;
  exenta: number;
  noRenta: number;
  incremento: number;
  credito: number;
  totalCorregido: number;
}

export interface DJ1886Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  tasa1cat: number;
  socios: DJ1886Socio[];
  totales: { afecta: number; exenta: number; noRenta: number; incremento: number; credito: number };
}

export async function generarDJ1886(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
): Promise<DJ1886Result> {
  const [empresa, config, socios] = await Promise.all([
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { rut: true, razonSocial: true } }),
    getConfig(empresaId),
    prisma.socio.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        retiros: {
          where: {
            empresaId,
            fecha: { gte: new Date(anio, 0, 1), lte: new Date(anio, 11, 31, 23, 59, 59) },
          },
        },
      },
    }),
  ]);

  const tasa = Number(config['tasa_1cat_pct'] ?? '0.25');
  const incrementoDe = (afecta: number) => (tasa < 1 ? Math.round((afecta * tasa) / (1 - tasa)) : 0);

  const filas: DJ1886Socio[] = socios.map((s, i) => {
    let afecta = 0, exenta = 0, noRenta = 0;
    for (const r of s.retiros) {
      const mc = Number(r.montoCorregido);
      if (r.tipoRenta === 'AFECTA') afecta += mc;
      else if (r.tipoRenta === 'EXENTA') exenta += mc;
      else noRenta += mc;
    }
    afecta = Math.round(afecta);
    exenta = Math.round(exenta);
    noRenta = Math.round(noRenta);
    const incremento = incrementoDe(afecta);
    return {
      nro: i + 1,
      rut: s.rut,
      nombre: s.nombre,
      tipo: s.tipo,
      porcentaje: s.porcentaje.toString(),
      nRetiros: s.retiros.length,
      afecta, exenta, noRenta,
      incremento,
      credito: incremento,
      totalCorregido: afecta + exenta + noRenta,
    };
  });

  const totales = filas.reduce((acc, f) => ({
    afecta: acc.afecta + f.afecta,
    exenta: acc.exenta + f.exenta,
    noRenta: acc.noRenta + f.noRenta,
    incremento: acc.incremento + f.incremento,
    credito: acc.credito + f.credito,
  }), { afecta: 0, exenta: 0, noRenta: 0, incremento: 0, credito: 0 });

  return {
    empresaRut: empresa?.rut ?? '',
    empresaNombre: empresa?.razonSocial ?? '',
    anio,
    tasa1cat: tasa,
    socios: filas,
    totales,
  };
}

// ── DJ 1948 (retiros, remesas y distribuciones — régimen 14 A) ──────────────
export interface DJ1948Socio {
  nro: number;
  rut: string;
  nombre: string;
  tipo: string;
  porcentaje: string;
  nRetiros: number;
  totalAfecta: number;    // histórico (sin corrección), por tipo de renta
  totalExenta: number;
  totalNoRenta: number;
  totalHistorico: number;
  totalCorregido: number;
  totalCreditoIdpc: number;
}

export interface DJ1948Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  tasa1cat: number;
  socios: DJ1948Socio[];
  totales: { historico: number; corregido: number; creditoIdpc: number; afecta: number; exenta: number; noRenta: number };
}

export async function generarDJ1948(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
): Promise<DJ1948Result> {
  const [empresa, config, socios] = await Promise.all([
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { rut: true, razonSocial: true } }),
    getConfig(empresaId),
    prisma.socio.findMany({
      where: { empresaId, activo: true },
      orderBy: { nombre: 'asc' },
      include: {
        retiros: { where: { empresaId, fecha: { gte: new Date(anio, 0, 1), lte: new Date(anio, 11, 31, 23, 59, 59) } } },
      },
    }),
  ]);

  const filas: DJ1948Socio[] = socios.map((s, i) => {
    let afecta = 0, exenta = 0, noRenta = 0, historico = 0, corregido = 0, credito = 0;
    for (const r of s.retiros) {
      const monto = Number(r.monto);
      historico += monto;
      corregido += Number(r.montoCorregido);
      credito += Number(r.creditoIdpc);
      if (r.tipoRenta === 'AFECTA') afecta += monto;
      else if (r.tipoRenta === 'EXENTA') exenta += monto;
      else noRenta += monto;
    }
    return {
      nro: i + 1,
      rut: s.rut,
      nombre: s.nombre,
      tipo: s.tipo,
      porcentaje: s.porcentaje.toString(),
      nRetiros: s.retiros.length,
      totalAfecta: Math.round(afecta),
      totalExenta: Math.round(exenta),
      totalNoRenta: Math.round(noRenta),
      totalHistorico: Math.round(historico),
      totalCorregido: Math.round(corregido),
      totalCreditoIdpc: Math.round(credito),
    };
  });

  const totales = filas.reduce((acc, f) => ({
    historico: acc.historico + f.totalHistorico,
    corregido: acc.corregido + f.totalCorregido,
    creditoIdpc: acc.creditoIdpc + f.totalCreditoIdpc,
    afecta: acc.afecta + f.totalAfecta,
    exenta: acc.exenta + f.totalExenta,
    noRenta: acc.noRenta + f.totalNoRenta,
  }), { historico: 0, corregido: 0, creditoIdpc: 0, afecta: 0, exenta: 0, noRenta: 0 });

  return {
    empresaRut: empresa?.rut ?? '',
    empresaNombre: empresa?.razonSocial ?? '',
    anio,
    tasa1cat: Number(config['tasa_1cat_pct'] ?? '0.25'),
    socios: filas,
    totales,
  };
}

/**
 * Recalcula montoCorregido y creditoIdpc de todos los retiros del año con la
 * tasa de 1ª categoría vigente (replica recalcular_retiros_ipc de ContaCL).
 * Útil tras cambiar la tasa o los factores IPC. Devuelve la cantidad actualizada.
 */
export async function recalcularRetirosIpc(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
): Promise<number> {
  const config = await getConfig(empresaId);
  const tasa = Number(config['tasa_1cat_pct'] ?? '0.25');
  const retiros = await prisma.retiro.findMany({
    where: { empresaId, fecha: { gte: new Date(anio, 0, 1), lte: new Date(anio, 11, 31, 23, 59, 59) } },
  });
  await Promise.all(retiros.map((r) => {
    const { montoCorregido, creditoIdpc } = calcularRetiro(Number(r.monto), Number(r.factorIpc), r.tipoRenta, tasa);
    return prisma.retiro.update({ where: { id: r.id }, data: { montoCorregido, creditoIdpc } });
  }));
  return retiros.length;
}

/** TXT de referencia con el formato pipe-delimited del SII para la DJ 1886. */
export function generarDJ1886Txt(dj: DJ1886Result): string {
  const lineas = dj.socios.map((f) => [
    f.rut, f.nombre,
    f.afecta, f.exenta, f.noRenta,
    f.incremento, f.credito, 0,
    f.nro,
  ].join('|'));
  const header = `DJ1886|${dj.anio}|${lineas.length}`;
  return [header, ...lineas].join('\n');
}
