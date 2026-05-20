import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { honorarioSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

const TASA_RETENCION = 0.1525;

router.get('/', async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { anio, mes } = req.query;

    const where: Record<string, unknown> = { empresaId };

    if (anio && mes) {
      const a = Number(anio);
      const m = Number(mes);
      where['fecha'] = {
        gte: new Date(a, m - 1, 1),
        lte: new Date(a, m, 0, 23, 59, 59, 999),
      };
    }

    const honorarios = await prisma.honorario.findMany({ where, orderBy: { fecha: 'desc' } });
    res.json({ data: honorarios });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(honorarioSchema), async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };
    const { prestadorRut, prestadorNombre, folio, fecha, monto, retiene, glosa } = req.body as {
      prestadorRut: string; prestadorNombre: string; folio: number; fecha: Date;
      monto: number; retiene: boolean; glosa?: string;
    };

    const retencion = retiene ? Math.round(monto * TASA_RETENCION) : 0;

    const honorario = await prisma.honorario.create({
      data: { empresaId, prestadorRut, prestadorNombre, folio, fecha, monto, retencion, retiene, glosa: glosa ?? null },
    });

    res.status(201).json({ data: honorario, message: 'Honorario registrado' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const existente = await prisma.honorario.findFirst({ where: { id, empresaId } });
    if (!existente) return next(createError('Honorario no encontrado', 404));
    await prisma.honorario.delete({ where: { id } });
    res.json({ message: 'Honorario eliminado' });
  } catch (err) {
    next(err);
  }
});

export default router;
