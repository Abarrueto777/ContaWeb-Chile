import type { PrismaClient } from '@prisma/client';

/**
 * DJ 1879 — Retenciones por rentas del Art. 42 N°2 (honorarios).
 * Declaración jurada anual al SII (AT = año + 1). Plazo: ~28 de marzo.
 *
 * Agrega las boletas de honorarios recibidas del año por prestador (RUT):
 * N° de boletas, renta bruta, retención e importe líquido.
 */

export interface DJ1879Prestador {
  nro: number;
  rut: string;
  nombre: string;
  nBoletas: number;
  bruto: number;
  retencion: number;
  neto: number;
}

export interface DJ1879Result {
  empresaRut: string;
  empresaNombre: string;
  anio: number;
  prestadores: DJ1879Prestador[];
  totales: { bruto: number; retencion: number; neto: number; boletas: number };
}

export async function generarDJ1879(
  empresaId: string,
  anio: number,
  prisma: PrismaClient,
): Promise<DJ1879Result> {
  const [empresa, honorarios] = await Promise.all([
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { rut: true, razonSocial: true } }),
    prisma.honorario.findMany({
      where: { empresaId, fecha: { gte: new Date(anio, 0, 1), lt: new Date(anio + 1, 0, 1) } },
    }),
  ]);

  const porRut = new Map<string, DJ1879Prestador>();
  for (const h of honorarios) {
    let agg = porRut.get(h.prestadorRut);
    if (!agg) {
      agg = { nro: 0, rut: h.prestadorRut, nombre: h.prestadorNombre, nBoletas: 0, bruto: 0, retencion: 0, neto: 0 };
      porRut.set(h.prestadorRut, agg);
    }
    const bruto = Number(h.monto);
    const retencion = Number(h.retencion);
    agg.nBoletas += 1;
    agg.bruto += bruto;
    agg.retencion += retencion;
    agg.neto += bruto - retencion;
  }

  const prestadores = [...porRut.values()]
    .map((p) => ({ ...p, bruto: Math.round(p.bruto), retencion: Math.round(p.retencion), neto: Math.round(p.neto) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  prestadores.forEach((p, i) => { p.nro = i + 1; });

  const totales = prestadores.reduce((acc, p) => ({
    bruto: acc.bruto + p.bruto,
    retencion: acc.retencion + p.retencion,
    neto: acc.neto + p.neto,
    boletas: acc.boletas + p.nBoletas,
  }), { bruto: 0, retencion: 0, neto: 0, boletas: 0 });

  return {
    empresaRut: empresa?.rut ?? '',
    empresaNombre: empresa?.razonSocial ?? '',
    anio,
    prestadores,
    totales,
  };
}

/** TXT de referencia con formato pipe-delimited del SII para la DJ 1879. */
export function generarDJ1879Txt(dj: DJ1879Result): string {
  const lineas = dj.prestadores.map((p) => {
    const rutRaw = p.rut.replace(/\./g, '').replace(/-/g, '');
    const cuerpo = rutRaw.length > 1 ? rutRaw.slice(0, -1) : rutRaw;
    const dv = rutRaw ? rutRaw.slice(-1).toUpperCase() : '0';
    return [cuerpo, dv, p.nombre.slice(0, 40), p.nBoletas, p.bruto, p.retencion, p.neto, p.nro].join('|');
  });
  const header = `DJ1879|${dj.anio}|${dj.empresaRut}|${lineas.length}`;
  return [header, ...lineas].join('\n');
}
