import type { PrismaClient } from '@prisma/client';
import { getConfig } from './config.service';

/**
 * F22 — Declaración de Renta Anual (borrador orientativo). Régimen ProPyme.
 *
 * Flujo (replica ContaCL rrhh.py calcular_f22):
 *   Utilidad neta (EERR del año) + gastos rechazados (Art. 33 N°1) + ajustes = RLI.
 *   Impuesto 1ª Cat = RLI × tasa. Créditos (PPM, SENCE, donaciones, retenciones, otros)
 *   se restan → impuesto neto → a pagar o devolución.
 *   PPM determinado = ventas netas del año × tasa PPM.
 *
 * Nota: el plan de cuentas de ContaWeb clasifica como INGRESO/GASTO (sin desglose
 * costos/adm/ventas/financieros), por lo que se reporta ingresos y gastos totales.
 */

export interface F22Ajustes {
  gastosRechazados?: number | undefined;
  ajustes?: number | undefined;
  creditoPpm?: number | undefined;       // 0 = usar PPM calculado
  creditoSence?: number | undefined;
  creditoDonaciones?: number | undefined;
  creditoOtros?: number | undefined;
  retenciones?: number | undefined;
}

export interface F22Result {
  anio: number;
  periodo: string;
  // Resultado del ejercicio
  ingresos: number;
  gastosTotal: number;
  utilidadNeta: number;
  // RLI
  gastosRechazados: number;
  ajustes: number;
  rentaLiquida: number;
  rentaImponible: number;
  // Impuesto
  tasa1cat: number;
  impuesto1cat: number;
  // PPM / créditos
  ventasNetas: number;
  tasaPpm: number;
  ppmAcumulado: number;
  creditoPpm: number;
  creditoSence: number;
  creditoDonaciones: number;
  creditoOtros: number;
  retenciones: number;
  totalCreditos: number;
  // Resultado final
  impuestoNeto: number;
  aPagar: number;
  devolucion: number;
  sueldosEmpresarial: number;
}

export async function calcularF22(
  empresaId: string,
  anio: number,
  ajustes: F22Ajustes,
  prisma: PrismaClient,
): Promise<F22Result> {
  const inicio = new Date(anio, 0, 1);
  const finExcl = new Date(anio + 1, 0, 1);

  const [config, cuentas, docs, liquidaciones] = await Promise.all([
    getConfig(empresaId),
    prisma.cuentaContable.findMany({
      where: { empresaId, tipo: { in: ['INGRESO', 'GASTO'] }, permiteMovimientos: true },
      include: { lineasAsiento: { where: { asiento: { empresaId, fecha: { gte: inicio, lt: finExcl } } } } },
    }),
    prisma.documentoTributario.findMany({
      where: {
        empresaId,
        fecha: { gte: inicio, lt: finExcl },
        estado: { not: 'ANULADO' },
        tipo: { in: ['BOLETA_ELECTRONICA', 'FACTURA_ELECTRONICA'] },
      },
      select: { neto: true },
    }),
    prisma.liquidacion.findMany({
      where: { empresaId, anio, trabajador: { tipo: 'SUELDO_EMPRESARIAL' } },
      select: { sueldoBase: true },
    }),
  ]);

  // ── Estado de resultados del año ──
  let ingresos = 0, gastosTotal = 0;
  for (const c of cuentas) {
    const debe = c.lineasAsiento.reduce((s, l) => s + Number(l.debe), 0);
    const haber = c.lineasAsiento.reduce((s, l) => s + Number(l.haber), 0);
    if (c.tipo === 'INGRESO') ingresos += haber - debe;
    else gastosTotal += debe - haber;
  }
  ingresos = Math.round(ingresos);
  gastosTotal = Math.round(gastosTotal);
  const utilidadNeta = ingresos - gastosTotal;

  // ── RLI ──
  const gastosRechazados = Math.round(ajustes.gastosRechazados ?? 0);
  const ajustesNorm = Math.round(ajustes.ajustes ?? 0);
  const rentaLiquida = utilidadNeta + gastosRechazados;
  const rentaImponible = Math.max(0, rentaLiquida + ajustesNorm);

  // ── Impuesto 1ª Categoría ──
  const tasa1cat = Number(config['tasa_1cat_pct'] ?? '0.25');
  const impuesto1cat = Math.round(rentaImponible * tasa1cat);

  // ── PPM y créditos ──
  const ventasNetas = Math.round(docs.reduce((s, d) => s + Number(d.neto), 0));
  const tasaPpm = Number(config['ppm_pct'] ?? '0.002');
  const ppmAcumulado = Math.round(ventasNetas * tasaPpm);
  const creditoPpm = ajustes.creditoPpm ? Math.round(ajustes.creditoPpm) : ppmAcumulado;
  const creditoSence = Math.round(ajustes.creditoSence ?? 0);
  const creditoDonaciones = Math.round(ajustes.creditoDonaciones ?? 0);
  const creditoOtros = Math.round(ajustes.creditoOtros ?? 0);
  const retenciones = Math.round(ajustes.retenciones ?? 0);
  const totalCreditos = creditoPpm + creditoSence + creditoDonaciones + creditoOtros + retenciones;

  // ── Resultado final ──
  const impuestoNeto = impuesto1cat - totalCreditos;
  const aPagar = Math.max(0, impuestoNeto);
  const devolucion = Math.max(0, -impuestoNeto);

  const sueldosEmpresarial = Math.round(liquidaciones.reduce((s, l) => s + Number(l.sueldoBase), 0));

  return {
    anio,
    periodo: `AT ${anio + 1} — Renta ${anio}`,
    ingresos, gastosTotal, utilidadNeta,
    gastosRechazados, ajustes: ajustesNorm, rentaLiquida, rentaImponible,
    tasa1cat, impuesto1cat,
    ventasNetas, tasaPpm, ppmAcumulado,
    creditoPpm, creditoSence, creditoDonaciones, creditoOtros, retenciones, totalCreditos,
    impuestoNeto, aPagar, devolucion,
    sueldosEmpresarial,
  };
}
