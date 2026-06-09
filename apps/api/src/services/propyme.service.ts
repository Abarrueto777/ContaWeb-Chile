import type { PrismaClient } from '@prisma/client';
import { getConfig } from './config.service';

/**
 * Resumen ProPyme D3 — Contabilidad Simplificada (Art. 14 D N°3 LIR).
 * Control del PPM mensual del régimen general ProPyme: las ventas se sincronizan
 * desde los documentos emitidos y el PPM se calcula con la tasa configurada (ppm_pct).
 *
 * Reutiliza la tabla rp_ppm (un PPM por empresa/mes), igual que ContaCL.
 */

export interface ProPymeResumen {
  anio: number;
  mes: number | null;          // null = anual
  ingresos: number;
  gastos: number;
  rentaLiquida: number;
  tasa1cat: number;
  impuesto1cat: number;
  tasaPpm: number;
  ppmAcumulado: number;
  diferencia: number;
  aPagar: number;
  aFavor: number;
}

/** Total neto de documentos emitidos (boletas/facturas) no anulados de un mes. */
export async function ventasNetoMes(empresaId: string, anio: number, mes: number, prisma: PrismaClient): Promise<number> {
  const docs = await prisma.documentoTributario.findMany({
    where: {
      empresaId,
      estado: { not: 'ANULADO' },
      tipo: { in: ['BOLETA_ELECTRONICA', 'FACTURA_ELECTRONICA'] },
      fecha: { gte: new Date(anio, mes - 1, 1), lt: new Date(anio, mes, 1) },
    },
    select: { neto: true },
  });
  return Math.round(docs.reduce((s, d) => s + Number(d.neto), 0));
}

export async function resumenProPyme(
  empresaId: string,
  anio: number,
  mes: number | null,
  prisma: PrismaClient,
): Promise<ProPymeResumen> {
  const inicio = new Date(anio, 0, 1);
  // Acumulado hasta el mes seleccionado (year-to-date), o todo el año si mes es null
  const finExcl = mes ? new Date(anio, mes, 1) : new Date(anio + 1, 0, 1);

  const [config, cuentas, ppm] = await Promise.all([
    getConfig(empresaId),
    prisma.cuentaContable.findMany({
      where: { empresaId, tipo: { in: ['INGRESO', 'GASTO'] }, permiteMovimientos: true },
      include: { lineasAsiento: { where: { asiento: { empresaId, fecha: { gte: inicio, lt: finExcl } } } } },
    }),
    prisma.rPPpm.findMany({ where: { empresaId, anio, pagado: true, ...(mes ? { mes: { lte: mes } } : {}) } }),
  ]);

  let ingresos = 0, gastos = 0;
  for (const c of cuentas) {
    const debe = c.lineasAsiento.reduce((s, l) => s + Number(l.debe), 0);
    const haber = c.lineasAsiento.reduce((s, l) => s + Number(l.haber), 0);
    if (c.tipo === 'INGRESO') ingresos += haber - debe;
    else gastos += debe - haber;
  }
  ingresos = Math.round(ingresos);
  gastos = Math.round(gastos);
  const rentaLiquida = ingresos - gastos;

  const tasa1cat = Number(config['tasa_1cat_pct'] ?? '0.25');
  const tasaPpm = Number(config['ppm_pct'] ?? '0.002');
  const impuesto1cat = Math.round(Math.max(0, rentaLiquida) * tasa1cat);
  const ppmAcumulado = Math.round(ppm.reduce((s, r) => s + Number(r.ppmMonto), 0));
  const diferencia = impuesto1cat - ppmAcumulado;

  return {
    anio, mes,
    ingresos, gastos, rentaLiquida,
    tasa1cat, impuesto1cat,
    tasaPpm, ppmAcumulado,
    diferencia,
    aPagar: Math.max(0, diferencia),
    aFavor: Math.max(0, -diferencia),
  };
}

/**
 * Sincroniza el PPM mensual desde los documentos emitidos. Para cada mes con
 * ventas (hasta el mes actual si es el año en curso) hace upsert del registro
 * rp_ppm con la tasa ppm_pct, preservando el estado de pago. Devuelve la cantidad.
 */
export async function sincronizarPpm(empresaId: string, anio: number, prisma: PrismaClient): Promise<number> {
  const config = await getConfig(empresaId);
  const tasaPpm = Number(config['ppm_pct'] ?? '0.002');
  const hoy = new Date();
  const limite = anio === hoy.getFullYear() ? hoy.getMonth() + 1 : 12;

  const existentes = await prisma.rPPpm.findMany({ where: { empresaId, anio } });
  const porMes = new Map(existentes.map((r) => [r.mes, r]));

  let actualizados = 0;
  for (let mes = 1; mes <= limite; mes++) {
    const ventas = await ventasNetoMes(empresaId, anio, mes, prisma);
    const existente = porMes.get(mes);
    if (ventas === 0 && !existente) continue;
    const monto = Math.round(ventas * tasaPpm);
    await prisma.rPPpm.upsert({
      where: { empresaId_anio_mes: { empresaId, anio, mes } },
      create: { empresaId, anio, mes, ventasPeriodo: ventas, ppmTasa: tasaPpm, ppmMonto: monto, pagado: existente?.pagado ?? false, observacion: existente?.observacion ?? '' },
      update: { ventasPeriodo: ventas, ppmTasa: tasaPpm, ppmMonto: monto },
    });
    actualizados++;
  }
  return actualizados;
}
