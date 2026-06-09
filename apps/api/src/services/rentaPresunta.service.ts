import type { PrismaClient } from '@prisma/client';
import { getConfig } from './config.service';

/**
 * Renta Presunta — Art. 20 N°1 b) LIR (agricultura) y Art. 34 LIR (transporte).
 * La renta se presume como un % del avalúo fiscal (predios) o de la tasación
 * (vehículos), no sobre la renta efectiva.
 */

export const TASA_PRESUNCION = 0.10;   // 10% sobre la base (ambos regímenes)
export const TASA_PPM_AGRICOLA = 0.0025; // 0,25% ventas — agricultura
export const TASA_PPM_TRANSPORTE = 0.0030; // 0,30% ingresos — transporte

export interface RentaPresuntaResult {
  anio: number;
  detalle: { id: string; tipo: 'AGRICOLA' | 'TRANSPORTE'; descripcion: string; base: number; rentaPresunta: number }[];
  baseAgricola: number;
  baseTransporte: number;
  rpAgricola: number;
  rpTransporte: number;
  rentaPresunta: number;
  impuesto1cat: number;
  tasaPresuncion: number;
  tasa1cat: number;
  ppmPagado: number;
  diferencia: number;
  aPagar: number;
  saldoFavor: number;
}

export async function calcularRentaPresunta(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
): Promise<RentaPresuntaResult> {
  const [config, bienes, ppm] = await Promise.all([
    getConfig(empresaId),
    prisma.rPBien.findMany({ where: { empresaId, activo: true }, orderBy: [{ tipo: 'asc' }, { createdAt: 'asc' }] }),
    prisma.rPPpm.findMany({ where: { empresaId, anio, pagado: true } }),
  ]);

  const tasa1cat = Number(config['tasa_1cat_pct'] ?? '0.25');

  let baseAgricola = 0, baseTransporte = 0;
  const detalle = bienes.map((b) => {
    const base = b.tipo === 'AGRICOLA' ? Number(b.avaluoFiscal) : Number(b.valorTasacion);
    if (b.tipo === 'AGRICOLA') baseAgricola += base; else baseTransporte += base;
    return {
      id: b.id,
      tipo: b.tipo,
      descripcion: b.descripcion || (b.tipo === 'AGRICOLA' ? (b.rolAvaluo ?? 'Predio agrícola') : (b.patente ?? 'Vehículo')),
      base: Math.round(base),
      rentaPresunta: Math.round(base * TASA_PRESUNCION),
    };
  });

  const rpAgricola = Math.round(baseAgricola * TASA_PRESUNCION);
  const rpTransporte = Math.round(baseTransporte * TASA_PRESUNCION);
  const rentaPresunta = rpAgricola + rpTransporte;
  const impuesto1cat = Math.round(rentaPresunta * tasa1cat);

  const ppmPagado = Math.round(ppm.reduce((s, r) => s + Number(r.ppmMonto), 0));
  const diferencia = impuesto1cat - ppmPagado;

  return {
    anio,
    detalle,
    baseAgricola: Math.round(baseAgricola),
    baseTransporte: Math.round(baseTransporte),
    rpAgricola, rpTransporte, rentaPresunta,
    impuesto1cat,
    tasaPresuncion: TASA_PRESUNCION,
    tasa1cat,
    ppmPagado,
    diferencia,
    aPagar: Math.max(0, diferencia),
    saldoFavor: Math.max(0, -diferencia),
  };
}

/** PPM del mes = ventas × tasa según tipo de régimen. */
export function calcularPpmMes(ventas: number, tipo: 'AGRICOLA' | 'TRANSPORTE'): { tasa: number; monto: number } {
  const tasa = tipo === 'AGRICOLA' ? TASA_PPM_AGRICOLA : TASA_PPM_TRANSPORTE;
  return { tasa, monto: Math.round(ventas * tasa) };
}

export async function resumenPpm(empresaId: string, anio: number, prisma: PrismaClient) {
  const registros = await prisma.rPPpm.findMany({ where: { empresaId, anio }, orderBy: { mes: 'asc' } });
  const totalVentas = registros.reduce((s, r) => s + Number(r.ventasPeriodo), 0);
  const totalPpm = registros.reduce((s, r) => s + Number(r.ppmMonto), 0);
  const totalPagado = registros.filter((r) => r.pagado).reduce((s, r) => s + Number(r.ppmMonto), 0);
  return {
    registros,
    totalVentas: Math.round(totalVentas),
    totalPpm: Math.round(totalPpm),
    totalPagado: Math.round(totalPagado),
    totalPendiente: Math.round(totalPpm - totalPagado),
  };
}
