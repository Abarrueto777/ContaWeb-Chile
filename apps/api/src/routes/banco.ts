import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { cuentaBancariaSchema, movimientoBancoSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

// Cuentas bancarias
router.get('/cuentas', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const cuentas = await prisma.cuentaBancaria.findMany({
      where: { empresaId },
      include: { _count: { select: { movimientos: true } } },
      orderBy: { banco: 'asc' },
    });
    res.json({ data: cuentas });
  } catch {
    res.status(500).json({ error: 'Error al obtener cuentas bancarias' });
  }
});

router.post('/cuentas', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = cuentaBancariaSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const cuenta = await prisma.cuentaBancaria.create({ data: { ...parsed.data, empresaId } });
    res.status(201).json({ data: cuenta });
  } catch {
    res.status(500).json({ error: 'Error al crear cuenta bancaria' });
  }
});

router.delete('/cuentas/:cuentaId', async (req, res) => {
  try {
    await prisma.cuentaBancaria.delete({ where: { id: req.params['cuentaId'] } });
    res.json({ message: 'Cuenta eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
});

// Movimientos
router.get('/cuentas/:cuentaId/movimientos', async (req, res) => {
  try {
    const { cuentaId } = req.params as { cuentaId: string };
    const { anio, mes } = req.query;
    const where: Record<string, unknown> = { cuentaId };
    if (anio && mes) {
      where['fecha'] = { gte: new Date(Number(anio), Number(mes) - 1, 1), lt: new Date(Number(anio), Number(mes), 1) };
    }
    const movimientos = await prisma.movimientoBanco.findMany({ where, orderBy: { fecha: 'asc' } });
    res.json({ data: movimientos });
  } catch {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
});

router.post('/cuentas/:cuentaId/movimientos', async (req, res) => {
  try {
    const { empresaId, cuentaId } = req.params as { empresaId: string; cuentaId: string };
    const parsed = movimientoBancoSchema.safeParse({ ...req.body, cuentaId });
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });

    const ultimo = await prisma.movimientoBanco.findFirst({ where: { cuentaId }, orderBy: { fecha: 'desc' } });
    const cuenta = await prisma.cuentaBancaria.findUniqueOrThrow({ where: { id: cuentaId } });
    const saldoAnterior = ultimo ? Number(ultimo.saldo) : Number(cuenta.saldoInicial);
    const saldo = saldoAnterior + Number(parsed.data.abono) - Number(parsed.data.cargo);

    const { cuentaId: _cid, glosa, ...movData } = parsed.data;
    const mov = await prisma.movimientoBanco.create({
      data: { ...movData, cuentaId, empresaId, saldo, glosa: glosa ?? null },
    });
    res.status(201).json({ data: mov });
  } catch {
    res.status(500).json({ error: 'Error al crear movimiento' });
  }
});

router.patch('/cuentas/:cuentaId/movimientos/:movId/conciliar', async (req, res) => {
  try {
    const mov = await prisma.movimientoBanco.update({ where: { id: req.params['movId'] }, data: { conciliado: true } });
    res.json({ data: mov });
  } catch {
    res.status(500).json({ error: 'Error al conciliar' });
  }
});

router.delete('/cuentas/:cuentaId/movimientos/:movId', async (req, res) => {
  try {
    await prisma.movimientoBanco.delete({ where: { id: req.params['movId'] } });
    res.json({ message: 'Movimiento eliminado' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar movimiento' });
  }
});

export default router;
