import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

async function getCuenta(db: PrismaClient, empresaId: string, codigo: string) {
  const c = await db.cuentaContable.findFirst({ where: { empresaId, codigo } });
  if (!c) throw new Error(`Cuenta ${codigo} no encontrada para empresa ${empresaId}`);
  return c;
}

async function proximoNumero(db: PrismaClient, empresaId: string) {
  const ultimo = await db.asientoContable.findFirst({
    where: { empresaId },
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
  return (ultimo?.numero ?? 0) + 1;
}

export async function asientoVenta(
  db: PrismaClient,
  empresaId: string,
  params: { fecha: Date; folio: number; neto: number; iva: number; total: number; tipo: string; glosa?: string | null; condicionPago?: 'CONTADO' | 'CREDITO' },
): Promise<void> {
  const { fecha, folio, neto, iva, total, tipo, glosa } = params;
  const condicionPago = params.condicionPago ?? 'CONTADO';
  const esExento = tipo === 'FACTURA_EXENTA' || tipo === 'BOLETA_EXENTA';
  const glosaAsiento = glosa ?? `Venta ${tipo} N°${folio}`;

  // Contado: la contrapartida es Caja. Crédito: Clientes (cuenta por cobrar).
  const cContrapartida = await getCuenta(db, empresaId, condicionPago === 'CONTADO' ? '1.1.01' : '1.1.03');
  const cVentas = await getCuenta(db, empresaId, '4.1.02');

  const lineas: { cuentaId: string; debe: Decimal; haber: Decimal; glosa: string | null }[] = [
    { cuentaId: cContrapartida.id, debe: new Decimal(total).toDecimalPlaces(4), haber: new Decimal(0), glosa: null },
    { cuentaId: cVentas.id, debe: new Decimal(0), haber: new Decimal(neto).toDecimalPlaces(4), glosa: null },
  ];

  if (!esExento && iva > 0) {
    const cIvaDebito = await getCuenta(db, empresaId, '2.1.03');
    lineas.push({ cuentaId: cIvaDebito.id, debe: new Decimal(0), haber: new Decimal(iva).toDecimalPlaces(4), glosa: null });
  }

  const numero = await proximoNumero(db, empresaId);
  await db.asientoContable.create({
    data: {
      empresaId, numero, fecha,
      glosa: glosaAsiento,
      lineas: { create: lineas },
    },
  });
}

export async function asientoCompra(
  db: PrismaClient,
  empresaId: string,
  params: { fecha: Date; folio: number; neto: number; iva: number; total: number; glosa?: string | null; condicionPago?: 'CONTADO' | 'CREDITO' },
): Promise<void> {
  const { fecha, folio, neto, iva, total, glosa } = params;
  const condicionPago = params.condicionPago ?? 'CONTADO';
  const glosaAsiento = glosa ?? `Compra factura N°${folio}`;

  const cGasto = await getCuenta(db, empresaId, '5.1.01');
  // Contado: la contrapartida es Caja. Crédito: Proveedores (cuenta por pagar).
  const cContrapartida = await getCuenta(db, empresaId, condicionPago === 'CONTADO' ? '1.1.01' : '2.1.01');

  const lineas: { cuentaId: string; debe: Decimal; haber: Decimal; glosa: string | null }[] = [
    { cuentaId: cGasto.id, debe: new Decimal(neto).toDecimalPlaces(4), haber: new Decimal(0), glosa: null },
    { cuentaId: cContrapartida.id, debe: new Decimal(0), haber: new Decimal(total).toDecimalPlaces(4), glosa: null },
  ];

  if (iva > 0) {
    const cIvaCredito = await getCuenta(db, empresaId, '1.1.05');
    lineas.splice(1, 0, {
      cuentaId: cIvaCredito.id, debe: new Decimal(iva).toDecimalPlaces(4), haber: new Decimal(0), glosa: null,
    });
  }

  const numero = await proximoNumero(db, empresaId);
  await db.asientoContable.create({
    data: {
      empresaId, numero, fecha,
      glosa: glosaAsiento,
      lineas: { create: lineas },
    },
  });
}
