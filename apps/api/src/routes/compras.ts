import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { validate } from '../middlewares/validate';
import { createError } from '../middlewares/errorHandler';
import { facturaRecibidaSchema } from '@contaweb/validations';

const router = Router({ mergeParams: true });

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

    const compras = await prisma.facturaRecibida.findMany({
      where,
      orderBy: { fecha: 'desc' },
    });

    res.json({ data: compras });
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(facturaRecibidaSchema), async (req, res, next) => {
  try {
    const { empresaId } = req.params as { empresaId: string };

    const compra = await prisma.facturaRecibida.create({
      data: { ...req.body, empresaId },
    });

    res.status(201).json({ data: compra, message: 'Factura recibida registrada' });
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'P2002') {
      return next(createError('Esta factura ya existe (mismo proveedor, tipo y folio)', 409));
    }
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { empresaId, id } = req.params as { empresaId: string; id: string };
    const existente = await prisma.facturaRecibida.findFirst({ where: { id, empresaId } });
    if (!existente) return next(createError('Factura no encontrada', 404));
    await prisma.facturaRecibida.delete({ where: { id } });
    res.json({ message: 'Factura eliminada' });
  } catch (err) {
    next(err);
  }
});

export default router;
