import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { trabajadorSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { activo } = req.query;
    const where: Record<string, unknown> = { empresaId };
    if (activo !== undefined) where['activo'] = activo === 'true';
    const trabajadores = await prisma.trabajador.findMany({ where, orderBy: { nombre: 'asc' } });
    res.json({ data: trabajadores });
  } catch {
    res.status(500).json({ error: 'Error al obtener trabajadores' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = trabajadorSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { montoMovilizacion, montoColacion, cargo, ...rest } = parsed.data;
    const trabajador = await prisma.trabajador.create({
      data: {
        ...rest,
        empresaId,
        ...(cargo !== undefined ? { cargo } : {}),
        ...(montoMovilizacion !== undefined ? { montoMovilizacion } : {}),
        ...(montoColacion !== undefined ? { montoColacion } : {}),
      },
    });
    res.status(201).json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al crear trabajador' });
  }
});

router.put('/:trabajadorId', async (req, res) => {
  try {
    const parsed = trabajadorSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { montoMovilizacion, montoColacion, cargo, ...rest } = parsed.data;
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params['trabajadorId'] },
      data: {
        ...rest,
        cargo: cargo ?? null,
        montoMovilizacion: montoMovilizacion ?? null,
        montoColacion: montoColacion ?? null,
      },
    });
    res.json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al actualizar trabajador' });
  }
});

router.patch('/:trabajadorId/desactivar', async (req, res) => {
  try {
    const trabajador = await prisma.trabajador.update({
      where: { id: req.params['trabajadorId'] },
      data: { activo: false },
    });
    res.json({ data: trabajador });
  } catch {
    res.status(500).json({ error: 'Error al desactivar trabajador' });
  }
});

export default router;
