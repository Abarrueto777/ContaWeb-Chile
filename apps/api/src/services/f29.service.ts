import { prisma } from '../lib/prisma';

export async function calcularF29(empresaId: string, anio: number, mes: number) {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 0, 23, 59, 59, 999);

  // --- Ventas (documentos emitidos) ---
  const emitidos = await prisma.documentoTributario.findMany({
    where: { empresaId, fecha: { gte: inicio, lte: fin }, estado: { not: 'ANULADO' } },
  });

  const ventasNeto = emitidos
    .filter((d) => d.tipo === 'FACTURA_ELECTRONICA' || d.tipo === 'BOLETA_ELECTRONICA')
    .reduce((s, d) => s + Number(d.neto), 0);

  const ivaEmitido = emitidos
    .filter((d) => d.tipo === 'FACTURA_ELECTRONICA' || d.tipo === 'BOLETA_ELECTRONICA')
    .reduce((s, d) => s + Number(d.iva), 0);

  const ivaNCEmitidas = emitidos
    .filter((d) => d.tipo === 'NOTA_CREDITO')
    .reduce((s, d) => s + Number(d.iva), 0);

  const debitoFiscal = Math.round(ivaEmitido - ivaNCEmitidas);

  // --- Compras (facturas recibidas) ---
  const compras = await prisma.facturaRecibida.findMany({
    where: { empresaId, fecha: { gte: inicio, lte: fin } },
  });

  const ivaCompras = compras
    .filter((c) => c.tipo === 'FACTURA' || c.tipo === 'LIQUIDACION_FACTURA')
    .reduce((s, c) => s + Number(c.iva), 0);

  const ivaNCRecibidas = compras
    .filter((c) => c.tipo === 'NOTA_CREDITO')
    .reduce((s, c) => s + Number(c.iva), 0);

  const impAdicional = compras.reduce((s, c) => s + Number(c.impAdicional), 0);
  const retencionIVA = compras.reduce((s, c) => s + Number(c.retencion), 0);

  const creditoFiscal = Math.round(ivaCompras - ivaNCRecibidas + impAdicional);

  // --- Honorarios ---
  const honorarios = await prisma.honorario.findMany({
    where: { empresaId, fecha: { gte: inicio, lte: fin } },
  });

  const retencionHonorarios = Math.round(
    honorarios.filter((h) => h.retiene).reduce((s, h) => s + Number(h.retencion), 0)
  );

  // --- PPM ---
  const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
  const ppmRate = Number(empresa?.ppmRate ?? 0.002);
  const ppm = Math.round(ventasNeto * ppmRate);

  // --- IVA a pagar ---
  const ivaNeto = Math.max(0, debitoFiscal - creditoFiscal);
  const remanente = Math.max(0, creditoFiscal - debitoFiscal);
  const totalAPagar = ivaNeto + ppm + retencionHonorarios - Math.round(retencionIVA);

  return {
    periodo: { anio, mes },
    ventas: {
      neto: Math.round(ventasNeto),
      ivaEmitido: Math.round(ivaEmitido),
      ivaNCEmitidas: Math.round(ivaNCEmitidas),
      debitoFiscal,
    },
    compras: {
      ivaCompras: Math.round(ivaCompras),
      ivaNCRecibidas: Math.round(ivaNCRecibidas),
      impAdicional: Math.round(impAdicional),
      retencionIVA: Math.round(retencionIVA),
      creditoFiscal,
    },
    honorarios: {
      cantidad: honorarios.length,
      montoTotal: Math.round(honorarios.reduce((s, h) => s + Number(h.monto), 0)),
      retencionHonorarios,
    },
    ppm: { tasa: ppmRate, monto: ppm },
    resultado: {
      ivaNeto,
      remanente,
      totalAPagar: Math.max(0, totalAPagar),
    },
  };
}
