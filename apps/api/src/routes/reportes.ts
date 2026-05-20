import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router({ mergeParams: true });

router.get('/libro-diario', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const inicio = new Date(Number(anio), Number(mes) - 1, 1);
    const fin = new Date(Number(anio), Number(mes), 1);

    const asientos = await prisma.asientoContable.findMany({
      where: { empresaId, fecha: { gte: inicio, lt: fin } },
      include: { lineas: { include: { cuenta: true } } },
      orderBy: [{ fecha: 'asc' }, { numero: 'asc' }],
    });

    const entries = asientos.flatMap((a) =>
      a.lineas.map((l) => ({
        fecha: a.fecha,
        numero: a.numero,
        glosa: a.glosa,
        cuentaCodigo: l.cuenta.codigo,
        cuentaNombre: l.cuenta.nombre,
        debe: Number(l.debe),
        haber: Number(l.haber),
      })),
    );
    res.json({ data: entries });
  } catch {
    res.status(500).json({ error: 'Error al generar libro diario' });
  }
});

router.get('/libro-mayor', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const inicio = new Date(Number(anio), Number(mes) - 1, 1);
    const fin = new Date(Number(anio), Number(mes), 1);

    const lineas = await prisma.lineaAsiento.findMany({
      where: { asiento: { empresaId, fecha: { gte: inicio, lt: fin } } },
      include: { cuenta: true, asiento: true },
      orderBy: { asiento: { fecha: 'asc' } },
    });

    const map = new Map<string, { cuenta: { codigo: string; nombre: string }; movs: { fecha: Date; glosa: string; debe: number; haber: number }[] }>();
    for (const l of lineas) {
      if (!map.has(l.cuentaId)) map.set(l.cuentaId, { cuenta: l.cuenta, movs: [] });
      map.get(l.cuentaId)!.movs.push({ fecha: l.asiento.fecha, glosa: l.asiento.glosa, debe: Number(l.debe), haber: Number(l.haber) });
    }

    const result = Array.from(map.values()).map(({ cuenta, movs }) => {
      let saldo = 0;
      const movimientos = movs.map((m) => { saldo += m.debe - m.haber; return { ...m, saldo }; });
      return {
        cuentaCodigo: cuenta.codigo,
        cuentaNombre: cuenta.nombre,
        movimientos,
        totalDebe: movs.reduce((s, m) => s + m.debe, 0),
        totalHaber: movs.reduce((s, m) => s + m.haber, 0),
        saldoFinal: saldo,
      };
    });
    res.json({ data: result });
  } catch {
    res.status(500).json({ error: 'Error al generar libro mayor' });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const hasta = new Date(Number(anio), Number(mes), 1);

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, permiteMovimientos: true },
      include: { lineasAsiento: { where: { asiento: { empresaId, fecha: { lt: hasta } } } } },
      orderBy: { codigo: 'asc' },
    });

    const entries = cuentas
      .map((c) => {
        const debe = c.lineasAsiento.reduce((s, l) => s + Number(l.debe), 0);
        const haber = c.lineasAsiento.reduce((s, l) => s + Number(l.haber), 0);
        const saldo = c.naturaleza === 'DEUDORA' ? debe - haber : haber - debe;
        return { codigo: c.codigo, nombre: c.nombre, tipo: c.tipo, saldo, nivel: c.nivel };
      })
      .filter((e) => e.saldo !== 0);
    res.json({ data: entries });
  } catch {
    res.status(500).json({ error: 'Error al generar balance' });
  }
});

router.get('/resultados', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const inicio = new Date(Number(anio), 0, 1);
    const hasta = new Date(Number(anio), Number(mes), 1);

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, tipo: { in: ['INGRESO', 'GASTO'] }, permiteMovimientos: true },
      include: { lineasAsiento: { where: { asiento: { empresaId, fecha: { gte: inicio, lt: hasta } } } } },
      orderBy: { codigo: 'asc' },
    });

    const toEntry = (c: (typeof cuentas)[0]) => {
      const debe = c.lineasAsiento.reduce((s, l) => s + Number(l.debe), 0);
      const haber = c.lineasAsiento.reduce((s, l) => s + Number(l.haber), 0);
      const saldo = c.tipo === 'INGRESO' ? haber - debe : debe - haber;
      return { codigo: c.codigo, nombre: c.nombre, tipo: c.tipo, saldo, nivel: c.nivel };
    };

    const ingresos = cuentas.filter((c) => c.tipo === 'INGRESO').map(toEntry).filter((e) => e.saldo !== 0);
    const gastos = cuentas.filter((c) => c.tipo === 'GASTO').map(toEntry).filter((e) => e.saldo !== 0);
    const totalIngresos = ingresos.reduce((s, e) => s + e.saldo, 0);
    const totalGastos = gastos.reduce((s, e) => s + e.saldo, 0);

    res.json({ data: { ingresos, gastos, totalIngresos, totalGastos, utilidadNeta: totalIngresos - totalGastos } });
  } catch {
    res.status(500).json({ error: 'Error al generar estado de resultados' });
  }
});

router.get('/balance8', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const hasta = new Date(Number(anio), Number(mes), 1);
    const inicioAnio = new Date(Number(anio), 0, 1);

    const cuentas = await prisma.cuentaContable.findMany({
      where: { empresaId, permiteMovimientos: true },
      include: {
        lineasAsiento: {
          where: { asiento: { empresaId, fecha: { lt: hasta } } },
          include: { asiento: { select: { fecha: true } } },
        },
      },
      orderBy: { codigo: 'asc' },
    });

    const rows = cuentas.map((c) => {
      const sumaDebe = c.lineasAsiento.reduce((s, l) => s + Number(l.debe), 0);
      const sumaHaber = c.lineasAsiento.reduce((s, l) => s + Number(l.haber), 0);

      const saldoDeudor = sumaDebe > sumaHaber ? sumaDebe - sumaHaber : 0;
      const saldoAcreedor = sumaHaber > sumaDebe ? sumaHaber - sumaDebe : 0;

      const isResultado = c.tipo === 'INGRESO' || c.tipo === 'GASTO';
      const balanceActivo = !isResultado && saldoDeudor > 0 ? saldoDeudor : 0;
      const balancePasivo = !isResultado && saldoAcreedor > 0 ? saldoAcreedor : 0;

      const debeResultado = c.tipo === 'GASTO' ? saldoDeudor : 0;
      const haberResultado = c.tipo === 'INGRESO' ? saldoAcreedor : 0;

      return {
        codigo: c.codigo,
        nombre: c.nombre,
        tipo: c.tipo,
        nivel: c.nivel,
        sumaDebe,
        sumaHaber,
        saldoDeudor,
        saldoAcreedor,
        balanceActivo,
        balancePasivo,
        debeResultado,
        haberResultado,
      };
    }).filter((r) => r.sumaDebe !== 0 || r.sumaHaber !== 0);

    const totales = {
      sumaDebe: rows.reduce((s, r) => s + r.sumaDebe, 0),
      sumaHaber: rows.reduce((s, r) => s + r.sumaHaber, 0),
      saldoDeudor: rows.reduce((s, r) => s + r.saldoDeudor, 0),
      saldoAcreedor: rows.reduce((s, r) => s + r.saldoAcreedor, 0),
      balanceActivo: rows.reduce((s, r) => s + r.balanceActivo, 0),
      balancePasivo: rows.reduce((s, r) => s + r.balancePasivo, 0),
      debeResultado: rows.reduce((s, r) => s + r.debeResultado, 0),
      haberResultado: rows.reduce((s, r) => s + r.haberResultado, 0),
    };

    const utilidad = totales.haberResultado - totales.debeResultado;

    res.json({ data: { rows, totales, utilidad } });
  } catch {
    res.status(500).json({ error: 'Error al generar balance de 8 columnas' });
  }
});

export default router;
