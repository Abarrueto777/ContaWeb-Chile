import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { activoFijoSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

router.get('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const activos = await prisma.activoFijo.findMany({ where: { empresaId, activo: true }, orderBy: { fechaCompra: 'desc' } });
    res.json({ data: activos });
  } catch {
    res.status(500).json({ error: 'Error al obtener activos' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const parsed = activoFijoSchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
    const { costoCompra, vidaUtilAnios, valorResidual, ...rest } = parsed.data;
    const depreciacionMes = (costoCompra - valorResidual) / vidaUtilAnios / 12;
    const activo = await prisma.activoFijo.create({
      data: { ...rest, costoCompra, vidaUtilAnios, valorResidual, depreciacionMes, empresaId },
    });
    res.status(201).json({ data: activo });
  } catch {
    res.status(500).json({ error: 'Error al crear activo' });
  }
});

router.post('/:activoId/depreciar', async (req, res) => {
  try {
    const activo = await prisma.activoFijo.findUniqueOrThrow({ where: { id: req.params['activoId'] } });
    const nuevaAcum = Number(activo.acumDepreciacion) + Number(activo.depreciacionMes);
    const valorNeto = Number(activo.costoCompra) - nuevaAcum;
    const updated = await prisma.activoFijo.update({
      where: { id: req.params['activoId'] },
      data: { acumDepreciacion: nuevaAcum, activo: valorNeto > Number(activo.valorResidual) },
    });
    res.json({ data: updated });
  } catch {
    res.status(500).json({ error: 'Error al depreciar activo' });
  }
});

router.delete('/:activoId', async (req, res) => {
  try {
    await prisma.activoFijo.update({ where: { id: req.params['activoId'] }, data: { activo: false } });
    res.json({ message: 'Activo dado de baja' });
  } catch {
    res.status(500).json({ error: 'Error al dar de baja activo' });
  }
});

export default router;
