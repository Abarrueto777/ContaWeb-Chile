import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { liquidacionInputSchema } from '@contaweb/validations';
import { calcularLiquidacion } from '../services/liquidacion.service';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;
    const where: Record<string, unknown> = { empresaId };
    if (anio) where['anio'] = Number(anio);
    if (mes) where['mes'] = Number(mes);
    const liquidaciones = await prisma.liquidacion.findMany({
      where,
      include: { trabajador: true },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    });
    res.json({ data: liquidaciones });
  } catch {
    res.status(500).json({ error: 'Error al obtener liquidaciones' });
  }
});

router.post('/calcular', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const resultado = calcularLiquidacion(trabajador, { ...parsed.data, uf: 38000 });
    res.json({ data: resultado });
  } catch {
    res.status(500).json({ error: 'Error al calcular liquidación' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = liquidacionInputSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const trabajador = await prisma.trabajador.findFirst({ where: { id: parsed.data.trabajadorId, empresaId } });
    if (!trabajador) return void res.status(404).json({ error: 'Trabajador no encontrado' });
    const calc = calcularLiquidacion(trabajador, { ...parsed.data, uf: 38000 });
    const liquidacion = await prisma.liquidacion.create({
      data: { empresaId, trabajadorId: parsed.data.trabajadorId, anio: parsed.data.anio, mes: parsed.data.mes, ...calc },
      include: { trabajador: true },
    });
    res.status(201).json({ data: liquidacion });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'P2002') {
      return void res.status(409).json({ error: 'Ya existe una liquidación para este trabajador en el período' });
    }
    res.status(500).json({ error: 'Error al guardar liquidación' });
  }
});

router.patch('/:liquidacionId/pagar', async (req, res) => {
  try {
    const liq = await prisma.liquidacion.update({ where: { id: req.params['liquidacionId'] }, data: { pagada: true } });
    res.json({ data: liq });
  } catch {
    res.status(500).json({ error: 'Error al marcar pagada' });
  }
});

router.delete('/:liquidacionId', async (req, res) => {
  try {
    await prisma.liquidacion.delete({ where: { id: req.params['liquidacionId'] } });
    res.json({ message: 'Liquidación eliminada' });
  } catch {
    res.status(500).json({ error: 'Error al eliminar liquidación' });
  }
});

export default router;
